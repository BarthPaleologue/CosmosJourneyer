import type { ChannelAssignment, PackRequest, PackedTexture, PreviewResponse } from "./types";

interface LoadedImage {
    readonly assignment: ChannelAssignment;
    readonly image: DecodedImage;
}

interface CachedImage {
    readonly signature: FileSignature;
    readonly image: DecodedImage;
}

export interface FileSignature {
    readonly byteLength: number;
    readonly contentHash: string;
    readonly modifiedAt: number;
}

export interface DecodedImage {
    readonly width: number;
    readonly height: number;
    readonly pixels: Uint8ClampedArray;
}

export interface PackerFileAdapter<TInput> {
    readSignature(input: TInput): Promise<FileSignature>;
    decodeImage(input: TInput): Promise<DecodedImage>;
    getDisplayName(input: TInput): string;
}

export interface PackerImageAdapter<TEncodedPng> {
    buildPreviewTexture(packed: PackedTexture, maxEdge: number): PackedTexture;
    encodePng(packed: PackedTexture): Promise<TEncodedPng>;
}

export interface SaveResponse<TEncodedPng> {
    readonly width: number;
    readonly height: number;
    readonly payload: TEncodedPng;
    readonly fileName: string;
}

export class PackerError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "PackerError";
    }
}

export class ImageCache {
    private readonly entries = new Map<string, CachedImage>();

    public synchronize(paths: ReadonlySet<string>): void {
        for (const key of this.entries.keys()) {
            if (!paths.has(key)) {
                this.entries.delete(key);
            }
        }
    }

    public get(path: string): CachedImage | undefined {
        return this.entries.get(path);
    }

    public set(path: string, entry: CachedImage): void {
        this.entries.set(path, entry);
    }
}

export function createPackerEngine<TInput, TEncodedPng>(
    fileAdapter: PackerFileAdapter<TInput>,
    imageAdapter: PackerImageAdapter<TEncodedPng>,
) {
    return {
        async generatePreview(
            request: PackRequest,
            inputsByKey: ReadonlyMap<string, TInput>,
            cache: ImageCache,
            maxPreviewEdge: number,
        ): Promise<PreviewResponse> {
            const packed = await packTexture(request, inputsByKey, cache, fileAdapter);
            const preview = imageAdapter.buildPreviewTexture(packed, maxPreviewEdge);

            return {
                pixelBytes: preview.pixels,
                width: packed.width,
                height: packed.height,
                previewWidth: preview.width,
                previewHeight: preview.height,
                activeInputs: packed.activeInputs,
            };
        },

        async savePacked(
            request: PackRequest,
            inputsByKey: ReadonlyMap<string, TInput>,
            cache: ImageCache,
            fileName: string,
        ): Promise<SaveResponse<TEncodedPng>> {
            const packed = await packTexture(request, inputsByKey, cache, fileAdapter);
            const payload = await imageAdapter.encodePng(packed);

            return {
                width: packed.width,
                height: packed.height,
                payload,
                fileName,
            };
        },

        synchronizeCache(request: PackRequest, cache: ImageCache): void {
            synchronizeCache(request, cache);
        },
    };
}

function synchronizeCache(request: PackRequest, cache: ImageCache): void {
    const retainedKeys = new Set<string>();

    for (const row of request.rows) {
        if (row.inputKey !== null) {
            retainedKeys.add(row.inputKey);
        }
    }

    cache.synchronize(retainedKeys);
}

async function packTexture<TInput>(
    request: PackRequest,
    inputsByKey: ReadonlyMap<string, TInput>,
    cache: ImageCache,
    fileAdapter: PackerFileAdapter<TInput>,
): Promise<PackedTexture> {
    synchronizeCache(request, cache);
    const loadedImages = await loadImages(request, inputsByKey, cache, fileAdapter);
    const reference = loadedImages.at(0);
    if (reference === undefined) {
        throw new PackerError("Select at least one texture before packing.");
    }

    const uniqueInputs = new Set<string>();
    for (const row of request.rows) {
        if (row.inputKey !== null) {
            uniqueInputs.add(row.inputKey);
        }
    }
    const activeInputs = uniqueInputs.size;
    const width = reference.image.width;
    const height = reference.image.height;
    const pixelCount = width * height;
    const pixels = new Uint8ClampedArray(pixelCount * 4);

    for (const row of request.rows) {
        const destinationOffset = channelByteOffset(row.outputChannel);
        const matched = loadedImages.find((candidate) => candidate.assignment.outputChannel === row.outputChannel);

        if (matched !== undefined) {
            const sourceOffset = channelByteOffset(row.sourceChannel);
            for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
                const outputIndex = pixelIndex * 4 + destinationOffset;
                const sourceIndex = pixelIndex * 4 + sourceOffset;
                pixels[outputIndex] = matched.image.pixels[sourceIndex] ?? row.constantFill;
            }
            continue;
        }

        for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
            pixels[pixelIndex * 4 + destinationOffset] = row.constantFill;
        }
    }

    return {
        width,
        height,
        activeInputs,
        pixels,
    };
}

async function loadImages<TInput>(
    request: PackRequest,
    inputsByKey: ReadonlyMap<string, TInput>,
    cache: ImageCache,
    fileAdapter: PackerFileAdapter<TInput>,
): Promise<readonly LoadedImage[]> {
    const loadedImages: LoadedImage[] = [];
    const requestImages = new Map<string, DecodedImage>();
    let expectedDimensions: readonly [number, number] | null = null;

    for (const row of request.rows) {
        const inputKey = row.inputKey;
        if (inputKey === null) {
            continue;
        }

        const input = inputsByKey.get(inputKey);
        if (input === undefined) {
            throw new PackerError("Missing source texture data. Re-select the input texture and try again.");
        }

        const image = await (async () => {
            const existing = requestImages.get(inputKey);
            if (existing !== undefined) {
                return existing;
            }

            const cached = await loadCachedImage(inputKey, input, cache, fileAdapter);
            requestImages.set(inputKey, cached);
            return cached;
        })();

        if (expectedDimensions === null) {
            expectedDimensions = [image.width, image.height];
        } else if (image.width !== expectedDimensions[0] || image.height !== expectedDimensions[1]) {
            throw new PackerError(
                `Image dimensions must match. ${fileAdapter.getDisplayName(input)} is ${image.width}x${image.height}, expected ${expectedDimensions[0]}x${expectedDimensions[1]}.`,
            );
        }

        loadedImages.push({
            assignment: row,
            image,
        });
    }

    return loadedImages;
}

async function loadCachedImage<TInput>(
    key: string,
    input: TInput,
    cache: ImageCache,
    fileAdapter: PackerFileAdapter<TInput>,
): Promise<DecodedImage> {
    const signature = await fileAdapter.readSignature(input);
    const cached = cache.get(key);
    if (cached !== undefined && areSignaturesEqual(cached.signature, signature)) {
        return cached.image;
    }

    const decoded = await fileAdapter.decodeImage(input);
    cache.set(key, {
        signature,
        image: decoded,
    });

    return decoded;
}

function areSignaturesEqual(left: FileSignature, right: FileSignature): boolean {
    return (
        left.byteLength === right.byteLength &&
        left.contentHash === right.contentHash &&
        left.modifiedAt === right.modifiedAt
    );
}

function channelByteOffset(channel: ChannelAssignment["outputChannel"]): number {
    if (channel === "r") {
        return 0;
    }

    if (channel === "g") {
        return 1;
    }

    if (channel === "b") {
        return 2;
    }

    return 3;
}
