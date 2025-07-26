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

import { type WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { createRawTexture2DArrayFromUrls, type Texture2dArrayMosaic } from "@/utils/texture";
import { ok, type Result } from "@/utils/types";

import type { ILoadingProgressMonitor } from "../../loadingProgressMonitor";
import { loadTextureAsync } from "../utils";

import moonAlbedoPath from "@assets/sol/textures/moonColor8k.png";
import moonAlbedoPath_0_0 from "@assets/sol/textures/moonColorMap2x4/0_0.png";
import moonAlbedoPath_0_1 from "@assets/sol/textures/moonColorMap2x4/0_1.png";
import moonAlbedoPath_0_2 from "@assets/sol/textures/moonColorMap2x4/0_2.png";
import moonAlbedoPath_0_3 from "@assets/sol/textures/moonColorMap2x4/0_3.png";
import moonAlbedoPath_1_0 from "@assets/sol/textures/moonColorMap2x4/1_0.png";
import moonAlbedoPath_1_1 from "@assets/sol/textures/moonColorMap2x4/1_1.png";
import moonAlbedoPath_1_2 from "@assets/sol/textures/moonColorMap2x4/1_2.png";
import moonAlbedoPath_1_3 from "@assets/sol/textures/moonColorMap2x4/1_3.png";
import moonNormalPath from "@assets/sol/textures/moonNormalMap8k.png";

export async function loadMoonAlbedo(scene: Scene, progressMonitor: ILoadingProgressMonitor | null): Promise<Texture> {
    return loadTextureAsync("MoonAlbedo", moonAlbedoPath, scene, progressMonitor);
}

export async function loadMoonNormal(scene: Scene, progressMonitor: ILoadingProgressMonitor | null): Promise<Texture> {
    return loadTextureAsync("MoonNormal", moonNormalPath, scene, progressMonitor);
}

export async function loadMoonHighResolutionAlbedo(
    scene: Scene,
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Result<Texture2dArrayMosaic, Error>> {
    const loadingResult = await createRawTexture2DArrayFromUrls(
        [
            moonAlbedoPath_0_0,
            moonAlbedoPath_0_1,
            moonAlbedoPath_0_2,
            moonAlbedoPath_0_3,
            moonAlbedoPath_1_0,
            moonAlbedoPath_1_1,
            moonAlbedoPath_1_2,
            moonAlbedoPath_1_3,
        ],
        scene,
        engine,
        progressMonitor,
    );

    if (!loadingResult.success) {
        return loadingResult;
    }

    return ok({
        type: "texture_2d_array_mosaic",
        array: loadingResult.value,
        tileCount: { x: 4, y: 2 },
    });
}
