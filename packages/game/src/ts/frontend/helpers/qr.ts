//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { AbstractEngine, Camera, Scene } from "@babylonjs/core/pure";
import { CreateScreenshotAsync, DynamicTexture, Texture } from "@babylonjs/core/pure";
import jsQR from "jsqr";
import { toCanvas } from "qrcode";
import type { QRCodeRenderersOptions } from "qrcode";

/**
 * Renders a QR code into a dynamic texture with corrected UV orientation.
 * @param content - Text encoded in the QR code.
 * @param scene - Scene that owns the created resources.
 * @param options - QR code rendering settings; width defaults to 512 pixels.
 * @returns The dynamic texture, owned by the caller.
 */
export async function makeQrCodeTexture(content: string, scene: Scene, options?: QRCodeRenderersOptions) {
    const size = options?.width ?? 512;
    const texture = new DynamicTexture(
        "qrCodeTexture",
        { width: size, height: size },
        scene,
        false,
        Texture.NEAREST_SAMPLINGMODE,
    );
    await toCanvas(texture.getContext().canvas, content, {
        ...options,
        width: size,
    });
    texture.update(false);
    texture.uScale = -1;
    texture.uOffset = 1;
    texture.vScale = -1;
    texture.vOffset = 1;

    return texture;
}

/**
 * @param engine - Rendering engine used for the capture.
 * @param camera - Camera whose view is searched for a QR code.
 * @returns Decoded text, or null when no QR code is found or pixels are unavailable.
 */
export async function decodeQrCodeFromScreenshot(engine: AbstractEngine, camera: Camera): Promise<string | null> {
    const screenshot = await CreateScreenshotAsync(engine, camera, { precision: 1 });
    const image = await loadImage(screenshot);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (context === null) {
        return null;
    }

    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(pixels.data, pixels.width, pixels.height)?.data ?? null;
}

/**
 * Rejects if the browser cannot decode the screenshot image.
 * @param source - Screenshot data URL to decode.
 * @returns The fully loaded image element.
 */
async function loadImage(source: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = source;

    await new Promise<void>((resolve, reject) => {
        image.addEventListener(
            "load",
            () => {
                resolve();
            },
            { once: true },
        );
        image.addEventListener(
            "error",
            () => {
                reject(new Error("Failed to decode the Babylon.js screenshot"));
            },
            { once: true },
        );
    });

    return image;
}
