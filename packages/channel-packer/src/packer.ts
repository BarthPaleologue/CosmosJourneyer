import type { Result } from "@cosmos-journeyer/typescript";
import { err, ok } from "@cosmos-journeyer/typescript";

import { createPackerEngine, ImageCache } from "./packerCore";
import type { DecodedImage, FileSignature } from "./packerCore";
import type { PackRequest, PackedTexture, PreviewResponse } from "./types";

export { ImageCache };

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

/**
 * @param request - Output channel assignments and constant fills.
 * @param filesByKey - Selected browser files indexed by their routing keys.
 * @param cache - Decoded image cache retained between operations.
 * @param maxPreviewEdge - Maximum preview width or height in pixels.
 * @returns Packed pixels, original dimensions, and bounded preview dimensions.
 */
export async function generatePreview(
    request: PackRequest,
    filesByKey: ReadonlyMap<string, File>,
    cache: ImageCache,
    maxPreviewEdge: number,
): Promise<Result<PreviewResponse, Error>> {
    return BrowserPackerEngine.generatePreview(request, filesByKey, cache, maxPreviewEdge);
}

/**
 * @param request - Output channel assignments and constant fills.
 * @param filesByKey - Selected browser files indexed by their routing keys.
 * @param cache - Decoded image cache retained between operations.
 * @param fileName - Download filename.
 * @returns The encoded PNG and output metadata.
 */
export async function savePackedPng(
    request: PackRequest,
    filesByKey: ReadonlyMap<string, File>,
    cache: ImageCache,
    fileName: string,
): Promise<Result<SaveResponse, Error>> {
    const result = await BrowserPackerEngine.savePacked(request, filesByKey, cache, fileName);
    if (!result.success) {
        return result;
    }

    return ok(mapSaveResponse(result.value));
}

/**
 * Retains cached images referenced by the current packing request.
 * @param request - Channel assignments and constant fills.
 * @param cache - Decoded image cache retained between operations.
 */
export function synchronizeCache(request: PackRequest, cache: ImageCache): void {
    BrowserPackerEngine.synchronizeCache(request, cache);
}

/**
 * @param response - Engine result containing the encoded payload and dimensions.
 * @param response.width - Output width in pixels.
 * @param response.height - Output height in pixels.
 * @param response.payload - Encoded PNG blob.
 * @param response.fileName - Download filename.
 * @returns The public save response with the PNG blob.
 */
function mapSaveResponse(response: { width: number; height: number; payload: Blob; fileName: string }): SaveResponse {
    return {
        width: response.width,
        height: response.height,
        blob: response.payload,
        fileName: response.fileName,
    };
}

/**
 * Computes a hexadecimal SHA-256 digest for cache validation.
 * @param bytes - File contents to hash.
 * @returns The lowercase hexadecimal content digest.
 */
async function hashFileContents(bytes: ArrayBuffer): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hashBytes = new Uint8Array(digest);
    return Array.from(hashBytes)
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Decodes a browser file into RGBA pixels and closes the temporary bitmap.
 * @param file - Selected source file.
 * @returns Decoded image dimensions and RGBA pixels, or the failure cause.
 */
async function decodeImage(file: File): Promise<Result<DecodedImage, Error>> {
    let bitmap: ImageBitmap | null = null;

    try {
        bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext("2d");
        if (context === null) {
            return err(new Error("Could not create an image decoding context."));
        }

        context.drawImage(bitmap, 0, 0);
        const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);

        return ok({
            width: bitmap.width,
            height: bitmap.height,
            pixels: imageData.data,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown image decode error.";
        return err(new Error(`Failed to open image ${file.name}. ${message}`));
    } finally {
        bitmap?.close();
    }
}

/**
 * Downscales packed pixels to fit the edge limit while preserving aspect ratio.
 * @param packed - Full-resolution packed pixels and dimensions.
 * @param maxEdge - Maximum preview width or height in pixels.
 * @returns The original texture if it fits, otherwise a downscaled preview.
 */
function buildPreviewTexture(packed: PackedTexture, maxEdge: number): Result<PackedTexture, Error> {
    if (packed.width <= maxEdge && packed.height <= maxEdge) {
        return ok(packed);
    }

    const scale = Math.min(maxEdge / packed.width, maxEdge / packed.height);
    const resizedWidth = Math.max(1, Math.floor(packed.width * scale));
    const resizedHeight = Math.max(1, Math.floor(packed.height * scale));

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = packed.width;
    sourceCanvas.height = packed.height;
    const sourceContext = sourceCanvas.getContext("2d");
    if (sourceContext === null) {
        return err(new Error("Could not create a preview rendering context."));
    }

    const sourceImageData = sourceContext.createImageData(packed.width, packed.height);
    sourceImageData.data.set(packed.pixels);
    sourceContext.putImageData(sourceImageData, 0, 0);

    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = resizedWidth;
    targetCanvas.height = resizedHeight;
    const targetContext = targetCanvas.getContext("2d");
    if (targetContext === null) {
        return err(new Error("Could not create a preview rendering context."));
    }

    targetContext.imageSmoothingEnabled = true;
    targetContext.imageSmoothingQuality = "high";
    targetContext.drawImage(sourceCanvas, 0, 0, resizedWidth, resizedHeight);

    return ok({
        width: resizedWidth,
        height: resizedHeight,
        activeInputs: packed.activeInputs,
        pixels: targetContext.getImageData(0, 0, resizedWidth, resizedHeight).data,
    });
}

/**
 * Encodes RGBA pixels through a browser canvas into a PNG blob.
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @param pixels - Interleaved RGBA pixel bytes.
 * @returns The encoded PNG blob, or the failure cause.
 */
async function encodePng(width: number, height: number, pixels: Uint8ClampedArray): Promise<Result<Blob, Error>> {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (context === null) {
        return err(new Error("Could not create a PNG encoding context."));
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
        return err(new Error("Failed to encode the packed PNG."));
    }

    return ok(blob);
}
