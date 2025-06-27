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

import type { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "../../loadingProgressMonitor";
import { loadTextureAsync } from "../utils";
import type { HeightMap1x1, HeightMap2x4 } from "./types";

import marsHeightMap1x1 from "@assets/sol/textures/marsHeightMap1x1.jpg";
import marsHeightMap_0_0 from "@assets/sol/textures/marsHeightMap2x4/0_0.jpg";
import marsHeightMap_0_1 from "@assets/sol/textures/marsHeightMap2x4/0_1.jpg";
import marsHeightMap_0_2 from "@assets/sol/textures/marsHeightMap2x4/0_2.jpg";
import marsHeightMap_0_3 from "@assets/sol/textures/marsHeightMap2x4/0_3.jpg";
import marsHeightMap_1_0 from "@assets/sol/textures/marsHeightMap2x4/1_0.jpg";
import marsHeightMap_1_1 from "@assets/sol/textures/marsHeightMap2x4/1_1.jpg";
import marsHeightMap_1_2 from "@assets/sol/textures/marsHeightMap2x4/1_2.jpg";
import marsHeightMap_1_3 from "@assets/sol/textures/marsHeightMap2x4/1_3.jpg";

export async function loadMarsHeightMap1x1(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<HeightMap1x1> {
    const marsHeightMap1x1Promise = loadTextureAsync("MarsHeightMap_1x1", marsHeightMap1x1, scene, progressMonitor);

    return {
        type: "1x1",
        texture: await marsHeightMap1x1Promise,
    };
}

export async function loadMarsHeightMapHighResolution(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<HeightMap2x4> {
    const marsHeightMapPromise_0_0 = loadTextureAsync("MarsHeightMap_0_0", marsHeightMap_0_0, scene, progressMonitor);
    const marsHeightMapPromise_0_1 = loadTextureAsync("MarsHeightMap_0_1", marsHeightMap_0_1, scene, progressMonitor);
    const marsHeightMapPromise_0_2 = loadTextureAsync("MarsHeightMap_0_2", marsHeightMap_0_2, scene, progressMonitor);
    const marsHeightMapPromise_0_3 = loadTextureAsync("MarsHeightMap_0_3", marsHeightMap_0_3, scene, progressMonitor);
    const marsHeightMapPromise_1_0 = loadTextureAsync("MarsHeightMap_1_0", marsHeightMap_1_0, scene, progressMonitor);
    const marsHeightMapPromise_1_1 = loadTextureAsync("MarsHeightMap_1_1", marsHeightMap_1_1, scene, progressMonitor);
    const marsHeightMapPromise_1_2 = loadTextureAsync("MarsHeightMap_1_2", marsHeightMap_1_2, scene, progressMonitor);
    const marsHeightMapPromise_1_3 = loadTextureAsync("MarsHeightMap_1_3", marsHeightMap_1_3, scene, progressMonitor);

    return {
        type: "2x4",
        textures: [
            [
                await marsHeightMapPromise_0_0,
                await marsHeightMapPromise_0_1,
                await marsHeightMapPromise_0_2,
                await marsHeightMapPromise_0_3,
            ],
            [
                await marsHeightMapPromise_1_0,
                await marsHeightMapPromise_1_1,
                await marsHeightMapPromise_1_2,
                await marsHeightMapPromise_1_3,
            ],
        ],
    };
}
