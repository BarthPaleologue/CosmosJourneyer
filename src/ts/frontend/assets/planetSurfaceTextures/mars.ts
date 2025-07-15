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

import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";

import { createRawTexture2DArrayFromUrls, createTextureAsync, Texture2dArrayMosaic } from "@/utils/texture";
import { ok, Result } from "@/utils/types";

import marsAlbedoPath from "@assets/sol/textures/marsColor8k.png";
import marsAlbedoPath_0_0 from "@assets/sol/textures/marsColorMap2x4/0_0.png";
import marsAlbedoPath_0_1 from "@assets/sol/textures/marsColorMap2x4/0_1.png";
import marsAlbedoPath_0_2 from "@assets/sol/textures/marsColorMap2x4/0_2.png";
import marsAlbedoPath_0_3 from "@assets/sol/textures/marsColorMap2x4/0_3.png";
import marsAlbedoPath_1_0 from "@assets/sol/textures/marsColorMap2x4/1_0.png";
import marsAlbedoPath_1_1 from "@assets/sol/textures/marsColorMap2x4/1_1.png";
import marsAlbedoPath_1_2 from "@assets/sol/textures/marsColorMap2x4/1_2.png";
import marsAlbedoPath_1_3 from "@assets/sol/textures/marsColorMap2x4/1_3.png";
import marsNormalPath from "@assets/sol/textures/marsNormalMap8k.png";

export async function loadMarsAlbedo(scene: Scene): Promise<Texture> {
    return createTextureAsync(marsAlbedoPath, scene);
}

export async function loadMarsNormal(scene: Scene): Promise<Texture> {
    return createTextureAsync(marsNormalPath, scene);
}

export async function loadMarsHighResolutionAlbedo(
    scene: Scene,
    engine: WebGPUEngine,
): Promise<Result<Texture2dArrayMosaic, Error>> {
    const loadingResult = await createRawTexture2DArrayFromUrls(
        [
            marsAlbedoPath_0_0,
            marsAlbedoPath_0_1,
            marsAlbedoPath_0_2,
            marsAlbedoPath_0_3,
            marsAlbedoPath_1_0,
            marsAlbedoPath_1_1,
            marsAlbedoPath_1_2,
            marsAlbedoPath_1_3,
        ],
        scene,
        engine,
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
