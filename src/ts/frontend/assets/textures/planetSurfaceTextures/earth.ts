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

import earthColorMap8k from "@assets/sol/textures/earthColor8k.png";
import earthColorMapPath_0_0 from "@assets/sol/textures/earthColorMap2x4/0_0.png";
import earthColorMapPath_0_1 from "@assets/sol/textures/earthColorMap2x4/0_1.png";
import earthColorMapPath_0_2 from "@assets/sol/textures/earthColorMap2x4/0_2.png";
import earthColorMapPath_0_3 from "@assets/sol/textures/earthColorMap2x4/0_3.png";
import earthColorMapPath_1_0 from "@assets/sol/textures/earthColorMap2x4/1_0.png";
import earthColorMapPath_1_1 from "@assets/sol/textures/earthColorMap2x4/1_1.png";
import earthColorMapPath_1_2 from "@assets/sol/textures/earthColorMap2x4/1_2.png";
import earthColorMapPath_1_3 from "@assets/sol/textures/earthColorMap2x4/1_3.png";
import earthNormalMapPath_0_0 from "@assets/sol/textures/earthNormalMap2x4/0_0.png";
import earthNormalMapPath_0_1 from "@assets/sol/textures/earthNormalMap2x4/0_1.png";
import earthNormalMapPath_0_2 from "@assets/sol/textures/earthNormalMap2x4/0_2.png";
import earthNormalMapPath_0_3 from "@assets/sol/textures/earthNormalMap2x4/0_3.png";
import earthNormalMapPath_1_0 from "@assets/sol/textures/earthNormalMap2x4/1_0.png";
import earthNormalMapPath_1_1 from "@assets/sol/textures/earthNormalMap2x4/1_1.png";
import earthNormalMapPath_1_2 from "@assets/sol/textures/earthNormalMap2x4/1_2.png";
import earthNormalMapPath_1_3 from "@assets/sol/textures/earthNormalMap2x4/1_3.png";
import earthNormalMap8k from "@assets/sol/textures/earthNormalMap8k.png";

export async function loadEarthAlbedo(scene: Scene, progressMonitor: ILoadingProgressMonitor | null): Promise<Texture> {
    return loadTextureAsync("EarthColorMap8k", earthColorMap8k, scene, progressMonitor);
}

export async function loadEarthNormal(scene: Scene, progressMonitor: ILoadingProgressMonitor | null): Promise<Texture> {
    return loadTextureAsync("EarthNormalMap8k", earthNormalMap8k, scene, progressMonitor);
}

export async function loadEarthHighResolutionAlbedo(
    scene: Scene,
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Result<Texture2dArrayMosaic, Error>> {
    const loadingResult = await createRawTexture2DArrayFromUrls(
        [
            earthColorMapPath_0_0,
            earthColorMapPath_0_1,
            earthColorMapPath_0_2,
            earthColorMapPath_0_3,
            earthColorMapPath_1_0,
            earthColorMapPath_1_1,
            earthColorMapPath_1_2,
            earthColorMapPath_1_3,
        ],
        scene,
        engine,
        progressMonitor,
    );

    if (!loadingResult.success) {
        return loadingResult;
    }

    return ok({ type: "texture_2d_array_mosaic", array: loadingResult.value, tileCount: { x: 4, y: 2 } });
}

export async function loadEarthHighResolutionNormal(
    scene: Scene,
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Result<Texture2dArrayMosaic, Error>> {
    const loadingResult = await createRawTexture2DArrayFromUrls(
        [
            earthNormalMapPath_0_0,
            earthNormalMapPath_0_1,
            earthNormalMapPath_0_2,
            earthNormalMapPath_0_3,
            earthNormalMapPath_1_0,
            earthNormalMapPath_1_1,
            earthNormalMapPath_1_2,
            earthNormalMapPath_1_3,
        ],
        scene,
        engine,
        progressMonitor,
    );

    if (!loadingResult.success) {
        return loadingResult;
    }

    return ok({ type: "texture_2d_array_mosaic", array: loadingResult.value, tileCount: { x: 4, y: 2 } });
}
