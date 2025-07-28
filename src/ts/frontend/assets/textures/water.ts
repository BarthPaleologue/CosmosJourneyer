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

import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadTextureAsync } from "./utils";

import waterNormal1 from "@assets/textures/waterNormalMap3.jpg";
import waterNormal2 from "@assets/textures/waterNormalMap4.jpg";

export type WaterTextures = {
    normalMap1: Texture;
    normalMap2: Texture;
};

export async function loadWaterTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<WaterTextures> {
    const waterNormalMap1Promise = loadTextureAsync("WaterNormalMap1", waterNormal1, scene, progressMonitor);
    const waterNormalMap2Promise = loadTextureAsync("WaterNormalMap2", waterNormal2, scene, progressMonitor);

    return {
        normalMap1: await waterNormalMap1Promise,
        normalMap2: await waterNormalMap2Promise,
    };
}
