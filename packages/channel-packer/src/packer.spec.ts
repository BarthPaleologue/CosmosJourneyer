import { describe, expect, it, vi } from "vitest";

import { createPackerEngine, ImageCache, type DecodedImage, type FileSignature } from "./packerCore";
import type { ChannelAssignment, ColorChannel, PackRequest, PackedTexture } from "./types";

interface TestInput {
    readonly name: string;
    readonly signature: FileSignature;
    readonly image: DecodedImage;
}

const decodeImage = vi.fn((input: TestInput): Promise<DecodedImage> => Promise.resolve(input.image));
const readSignature = vi.fn((input: TestInput): Promise<FileSignature> => Promise.resolve(input.signature));

const engine = createPackerEngine<TestInput, Uint8Array>(
    {
        readSignature(input) {
            return readSignature(input);
        },
        async decodeImage(input) {
            return decodeImage(input);
        },
        getDisplayName(input) {
            return input.name;
        },
    },
    {
        buildPreviewTexture(packed, maxEdge) {
            return resizePreview(packed, maxEdge);
        },
        encodePng(packed) {
            const bytes = new Uint8Array(packed.pixels.length);
            bytes.set(packed.pixels);
            return Promise.resolve(bytes);
        },
    },
);

describe("packer core", () => {
    it("applies default constants for unassigned channels", async () => {
        const source = createInput("red.png", 1, 1, [10, 20, 30, 40]);

        const preview = await engine.generatePreview(
            createPackRequest([
                assignment("r", "source", "g", 0),
                assignment("g", null, "g", 0),
                assignment("b", null, "b", 0),
                assignment("a", null, "a", 255),
            ]),
            new Map([["source", source]]),
            new ImageCache(),
            1024,
        );

        expect(preview.width).toBe(1);
        expect(preview.height).toBe(1);
        expect(preview.activeInputs).toBe(1);
        expect(Array.from(preview.pixelBytes)).toEqual([20, 0, 0, 255]);
    });

    it("counts unique input files for preview metadata", async () => {
        const source = createInput("source.png", 1, 1, [9, 19, 29, 39]);

        const preview = await engine.generatePreview(
            createPackRequest([
                assignment("r", "source", "r", 0),
                assignment("g", "source", "g", 0),
                assignment("b", null, "b", 0),
                assignment("a", null, "a", 255),
            ]),
            new Map([["source", source]]),
            new ImageCache(),
            1024,
        );

        expect(preview.activeInputs).toBe(1);
    });

    it("packs mixed source channels", async () => {
        const red = createInput("red.png", 1, 1, [5, 15, 25, 35]);
        const green = createInput("green.png", 1, 1, [50, 60, 70, 80]);
        const blue = createInput("blue.png", 1, 1, [90, 100, 110, 120]);
        const alpha = createInput("alpha.png", 1, 1, [130, 140, 150, 160]);

        const preview = await engine.generatePreview(
            createPackRequest([
                assignment("r", "red", "b", 0),
                assignment("g", "green", "a", 0),
                assignment("b", "blue", "r", 0),
                assignment("a", "alpha", "g", 255),
            ]),
            new Map([
                ["red", red],
                ["green", green],
                ["blue", blue],
                ["alpha", alpha],
            ]),
            new ImageCache(),
            1024,
        );

        expect(Array.from(preview.pixelBytes)).toEqual([25, 80, 90, 140]);
    });

    it("rejects dimension mismatches", async () => {
        const first = createInput("first.png", 1, 1, [1, 2, 3, 4]);
        const second = createInput("second.png", 2, 1, [5, 6, 7, 8, 9, 10, 11, 12]);

        await expect(
            engine.generatePreview(
                createPackRequest([
                    assignment("r", "first", "r", 0),
                    assignment("g", "second", "g", 0),
                    assignment("b", null, "b", 0),
                    assignment("a", null, "a", 255),
                ]),
                new Map([
                    ["first", first],
                    ["second", second],
                ]),
                new ImageCache(),
                1024,
            ),
        ).rejects.toThrow("Image dimensions must match");
    });

    it("encodes and returns PNG output", async () => {
        const source = createInput("source.png", 1, 1, [9, 19, 29, 39]);

        const saved = await engine.savePacked(
            createPackRequest([
                assignment("r", "source", "r", 0),
                assignment("g", "source", "g", 0),
                assignment("b", "source", "b", 0),
                assignment("a", "source", "a", 255),
            ]),
            new Map([["source", source]]),
            new ImageCache(),
            "packed-output.png",
        );

        expect(saved.width).toBe(1);
        expect(saved.height).toBe(1);
        expect(saved.fileName).toBe("packed-output.png");
        expect(saved.payload).toBeInstanceOf(Uint8Array);
        expect(saved.payload.length).toBe(4);
    });

    it("evicts cached images that are no longer referenced", () => {
        const cache = new ImageCache();
        cache.set("first", {
            inputRef: "first",
            signature: {
                byteLength: 1,
                contentHash: "a",
                modifiedAt: 1,
            },
            image: createImage(1, 1, [1, 2, 3, 4]),
        });
        cache.set("second", {
            inputRef: "second",
            signature: {
                byteLength: 1,
                contentHash: "b",
                modifiedAt: 1,
            },
            image: createImage(1, 1, [5, 6, 7, 8]),
        });

        engine.synchronizeCache(
            createPackRequest([
                assignment("r", "first", "r", 0),
                assignment("g", null, "g", 0),
                assignment("b", null, "b", 0),
                assignment("a", null, "a", 255),
            ]),
            cache,
        );

        expect(cache.get("first")).toBeDefined();
        expect(cache.get("second")).toBeUndefined();
    });

    it("downscales large preview payloads", async () => {
        const source = createInput("large.png", 2048, 1024, [9, 19, 29, 39]);

        const preview = await engine.generatePreview(
            createPackRequest([
                assignment("r", "source", "r", 0),
                assignment("g", "source", "g", 0),
                assignment("b", "source", "b", 0),
                assignment("a", "source", "a", 255),
            ]),
            new Map([["source", source]]),
            new ImageCache(),
            1024,
        );

        expect(preview.width).toBe(2048);
        expect(preview.height).toBe(1024);
        expect(preview.previewWidth).toBe(1024);
        expect(preview.previewHeight).toBe(512);
        expect(preview.pixelBytes.length).toBe(1024 * 512 * 4);
    });

    it("distinguishes same-size files with different contents", async () => {
        decodeImage.mockClear();
        readSignature.mockClear();
        const cache = new ImageCache();
        const first = createInput("source.png", 1, 1, [1, 2, 3, 4], {
            signature: {
                byteLength: 4,
                modifiedAt: 1,
                contentHash: "hash-a",
            },
        });
        const second = createInput("source.png", 1, 1, [9, 10, 11, 12], {
            signature: {
                byteLength: 4,
                modifiedAt: 1,
                contentHash: "hash-b",
            },
        });

        await engine.generatePreview(
            createPackRequest([
                assignment("r", "source", "r", 0),
                assignment("g", null, "g", 0),
                assignment("b", null, "b", 0),
                assignment("a", null, "a", 255),
            ]),
            new Map([["source", first]]),
            cache,
            1024,
        );

        const beforeCalls = decodeImage.mock.calls.length;

        await engine.generatePreview(
            createPackRequest([
                assignment("r", "source", "r", 0),
                assignment("g", null, "g", 0),
                assignment("b", null, "b", 0),
                assignment("a", null, "a", 255),
            ]),
            new Map([["source", second]]),
            cache,
            1024,
        );

        expect(decodeImage.mock.calls.length).toBe(beforeCalls + 1);
    });

    it("avoids signature reads on stable cache hits", async () => {
        decodeImage.mockClear();
        readSignature.mockClear();

        const cache = new ImageCache();
        const source = createInput("source.png", 1, 1, [1, 2, 3, 4]);
        const request = createPackRequest([
            assignment("r", "source", "r", 0),
            assignment("g", null, "g", 0),
            assignment("b", null, "b", 0),
            assignment("a", null, "a", 255),
        ]);
        const inputs = new Map([["source", source]]);

        await engine.generatePreview(request, inputs, cache, 1024);
        const signatureCallsAfterFirstPass = readSignature.mock.calls.length;
        const decodeCallsAfterFirstPass = decodeImage.mock.calls.length;

        await engine.generatePreview(request, inputs, cache, 1024);

        expect(readSignature.mock.calls.length).toBe(signatureCallsAfterFirstPass);
        expect(decodeImage.mock.calls.length).toBe(decodeCallsAfterFirstPass);
    });
});

function createPackRequest(
    rows: [ChannelAssignment, ChannelAssignment, ChannelAssignment, ChannelAssignment],
): PackRequest {
    return { rows };
}

function assignment(
    outputChannel: ColorChannel,
    inputKey: string | null,
    sourceChannel: ColorChannel,
    constantFill: number,
): ChannelAssignment {
    return {
        outputChannel,
        inputKey,
        sourceChannel,
        constantFill,
    };
}

function createInput(
    name: string,
    width: number,
    height: number,
    rgba: readonly number[],
    options?: {
        readonly signature?: FileSignature;
    },
): TestInput {
    return {
        name,
        signature: options?.signature ?? {
            byteLength: rgba.length,
            contentHash: `${name}-${width}-${height}-${rgba.join("-")}`,
            modifiedAt: 1,
        },
        image: createImage(width, height, rgba),
    };
}

function createImage(width: number, height: number, rgba: readonly number[]): DecodedImage {
    const pixels = new Uint8ClampedArray(width * height * 4);

    if (rgba.length === 4) {
        for (let index = 0; index < width * height; index += 1) {
            pixels.set(rgba, index * 4);
        }
    } else {
        pixels.set(rgba.slice(0, width * height * 4));
    }

    return {
        width,
        height,
        pixels,
    };
}

function resizePreview(packed: PackedTexture, maxEdge: number): PackedTexture {
    if (packed.width <= maxEdge && packed.height <= maxEdge) {
        return packed;
    }

    const scale = Math.min(maxEdge / packed.width, maxEdge / packed.height);
    const previewWidth = Math.max(1, Math.floor(packed.width * scale));
    const previewHeight = Math.max(1, Math.floor(packed.height * scale));
    const previewPixels = new Uint8ClampedArray(previewWidth * previewHeight * 4);

    const sourcePixels = packed.pixels;
    for (let y = 0; y < previewHeight; y += 1) {
        const sourceY = Math.min(packed.height - 1, Math.floor((y * packed.height) / previewHeight));
        for (let x = 0; x < previewWidth; x += 1) {
            const sourceX = Math.min(packed.width - 1, Math.floor((x * packed.width) / previewWidth));
            const sourceOffset = (sourceY * packed.width + sourceX) * 4;
            const targetOffset = (y * previewWidth + x) * 4;
            previewPixels[targetOffset] = sourcePixels[sourceOffset] ?? 0;
            previewPixels[targetOffset + 1] = sourcePixels[sourceOffset + 1] ?? 0;
            previewPixels[targetOffset + 2] = sourcePixels[sourceOffset + 2] ?? 0;
            previewPixels[targetOffset + 3] = sourcePixels[sourceOffset + 3] ?? 0;
        }
    }

    return {
        width: previewWidth,
        height: previewHeight,
        activeInputs: packed.activeInputs,
        pixels: previewPixels,
    };
}
