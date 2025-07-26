//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { Engine } from "@babylonjs/core/Engines/engine";
import { type WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { RawTexture2DArray } from "@babylonjs/core/Materials/Textures/rawTexture2DArray";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";

import { err, ok, type Result } from "./types";

export async function loadImageBitmap(url: string): Promise<Result<ImageBitmap, Error>> {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return ok(await createImageBitmap(blob, { colorSpaceConversion: "none" }));
    } catch (error) {
        return err(
            new Error(
                `Failed to load image bitmap from URL "${url}": ${error instanceof Error ? error.message : String(error)}`,
            ),
        );
    }
}

export async function loadImageBitmapArray(url: ReadonlyArray<string>): Promise<Result<Array<ImageBitmap>, Error>> {
    const promises: Array<Promise<Result<ImageBitmap, Error>>> = [];
    for (const urlItem of url) {
        promises.push(loadImageBitmap(urlItem));
    }

    const results = await Promise.all(promises);

    // Filter out any failed results
    const bitmaps: Array<ImageBitmap> = [];
    for (const result of results) {
        if (!result.success) {
            return result;
        }

        bitmaps.push(result.value);
    }

    return ok(bitmaps);
}

export async function createRawTexture2DArrayFromUrls(
    urls: ReadonlyArray<string>,
    scene: Scene,
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Result<RawTexture2DArray, Error>> {
    progressMonitor?.startTask();
    const bitMapsResult = await loadImageBitmapArray(urls);
    if (!bitMapsResult.success) {
        progressMonitor?.completeTask();
        return bitMapsResult;
    }

    const bitMaps = bitMapsResult.value;
    const cleanupBitmaps = () => {
        for (const bmp of bitMaps) {
            bmp.close();
        }
        progressMonitor?.completeTask();
    };

    const firstBitmap = bitMaps[0];
    if (firstBitmap === undefined) {
        progressMonitor?.completeTask();
        return err(new Error("No image bitmaps were loaded. Please check the URLs."));
    }

    const { width, height } = firstBitmap;
    const layers = bitMaps.length;

    // allocate the array texture – note: data = null
    const texArray = new RawTexture2DArray(
        null,
        width,
        height,
        layers,
        Engine.TEXTUREFORMAT_RGBA,
        scene,
        false,
        false,
        Texture.TRILINEAR_SAMPLINGMODE,
    );

    // === RAW WEBGPU UPLOAD ====================================================
    const device = engine._device;

    const internalTexture = texArray.getInternalTexture();
    if (internalTexture === null) {
        cleanupBitmaps();
        return err(new Error("Failed to get internal texture from RawTexture2DArray."));
    }

    const hardwareTexture = internalTexture._hardwareTexture;
    if (hardwareTexture === null) {
        cleanupBitmaps();
        return err(new Error("Failed to get hardware texture from internal texture."));
    }

    const gpuTexture = hardwareTexture.underlyingResource as GPUTexture;

    try {
        for (const [layer, bmp] of bitMaps.entries()) {
            device.queue.copyExternalImageToTexture(
                { source: bmp, flipY: false },
                { texture: gpuTexture, origin: { z: layer } },
                { width, height, depthOrArrayLayers: 1 },
            );
        }
    } catch (error) {
        if (error instanceof Error) {
            return err(error);
        }

        return err(new Error(`Failed to copy external image to texture: ${String(error)}`));
    } finally {
        cleanupBitmaps();
    }

    texArray.wrapU = Texture.CLAMP_ADDRESSMODE;
    texArray.wrapV = Texture.CLAMP_ADDRESSMODE;
    texArray.wrapR = Texture.CLAMP_ADDRESSMODE;

    return ok(texArray);
}

export type Texture2d = {
    type: "texture_2d";
    texture: Texture;
};

export type Texture2dArrayMosaic = {
    type: "texture_2d_array_mosaic";
    array: RawTexture2DArray;
    tileCount: {
        x: number;
        y: number;
    };
};

/**
 * 2D texture sampler types that can be sampled using a simple UV coordinate.
 */
export type Texture2dUv = Texture2d | Texture2dArrayMosaic;
