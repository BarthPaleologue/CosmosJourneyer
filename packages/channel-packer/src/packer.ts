import { createPackerEngine, ImageCache, PackerError, type DecodedImage, type FileSignature } from "./packerCore";
import type { PackRequest, PackedTexture, PreviewResponse } from "./types";

export { ImageCache, PackerError };

export interface SaveResponse {
    readonly width: number;
    readonly height: number;
    readonly blob: Blob;
    readonly fileName: string;
}

const BrowserPackerEngine = createPackerEngine<File, Blob>(
    {
        async readSignature(file) {
            const bytes = await file.arrayBuffer();

            const signature: FileSignature = {
                byteLength: file.size,
                contentHash: await hashFileContents(bytes),
                modifiedAt: file.lastModified,
            };

            return signature;
        },
        async decodeImage(file) {
            return decodeImage(file);
        },
        getDisplayName(file) {
            return file.name;
        },
    },
    {
        buildPreviewTexture(packed, maxEdge) {
            return buildPreviewTexture(packed, maxEdge);
        },
        async encodePng(packed) {
            return encodePng(packed.width, packed.height, packed.pixels);
        },
    },
);

export async function generatePreview(
    request: PackRequest,
    filesByKey: ReadonlyMap<string, File>,
    cache: ImageCache,
    maxPreviewEdge: number,
): Promise<PreviewResponse> {
    return BrowserPackerEngine.generatePreview(request, filesByKey, cache, maxPreviewEdge);
}

export async function savePackedPng(
    request: PackRequest,
    filesByKey: ReadonlyMap<string, File>,
    cache: ImageCache,
    fileName: string,
): Promise<SaveResponse> {
    const response = await BrowserPackerEngine.savePacked(request, filesByKey, cache, fileName);
    return mapSaveResponse(response);
}

export function synchronizeCache(request: PackRequest, cache: ImageCache): void {
    BrowserPackerEngine.synchronizeCache(request, cache);
}

function mapSaveResponse(response: { width: number; height: number; payload: Blob; fileName: string }): SaveResponse {
    return {
        width: response.width,
        height: response.height,
        blob: response.payload,
        fileName: response.fileName,
    };
}

async function hashFileContents(bytes: ArrayBuffer): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hashBytes = new Uint8Array(digest);
    return Array.from(hashBytes)
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
}

async function decodeImage(file: File): Promise<DecodedImage> {
    let bitmap: ImageBitmap | null = null;

    try {
        bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext("2d");
        if (context === null) {
            throw new PackerError("Could not create an image decoding context.");
        }

        context.drawImage(bitmap, 0, 0);
        const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);

        return {
            width: bitmap.width,
            height: bitmap.height,
            pixels: imageData.data,
        };
    } catch (error: unknown) {
        if (error instanceof PackerError) {
            throw error;
        }

        const message = error instanceof Error ? error.message : "Unknown image decode error.";
        throw new PackerError(`Failed to open image ${file.name}. ${message}`);
    } finally {
        bitmap?.close();
    }
}

function buildPreviewTexture(packed: PackedTexture, maxEdge: number): PackedTexture {
    if (packed.width <= maxEdge && packed.height <= maxEdge) {
        return packed;
    }

    const scale = Math.min(maxEdge / packed.width, maxEdge / packed.height);
    const resizedWidth = Math.max(1, Math.floor(packed.width * scale));
    const resizedHeight = Math.max(1, Math.floor(packed.height * scale));

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = packed.width;
    sourceCanvas.height = packed.height;
    const sourceContext = sourceCanvas.getContext("2d");
    if (sourceContext === null) {
        throw new PackerError("Could not create a preview rendering context.");
    }

    const sourceImageData = sourceContext.createImageData(packed.width, packed.height);
    sourceImageData.data.set(packed.pixels);
    sourceContext.putImageData(sourceImageData, 0, 0);

    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = resizedWidth;
    targetCanvas.height = resizedHeight;
    const targetContext = targetCanvas.getContext("2d");
    if (targetContext === null) {
        throw new PackerError("Could not create a preview rendering context.");
    }

    targetContext.imageSmoothingEnabled = true;
    targetContext.imageSmoothingQuality = "high";
    targetContext.drawImage(sourceCanvas, 0, 0, resizedWidth, resizedHeight);

    return {
        width: resizedWidth,
        height: resizedHeight,
        activeInputs: packed.activeInputs,
        pixels: targetContext.getImageData(0, 0, resizedWidth, resizedHeight).data,
    };
}

async function encodePng(width: number, height: number, pixels: Uint8ClampedArray): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (context === null) {
        throw new PackerError("Could not create a PNG encoding context.");
    }

    const imageData = context.createImageData(width, height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => {
            resolve(value);
        }, "image/png");
    });

    if (blob === null) {
        throw new PackerError("Failed to encode the packed PNG.");
    }

    return blob;
}
