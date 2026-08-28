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
