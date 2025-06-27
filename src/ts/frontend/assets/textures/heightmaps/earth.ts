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

import earthHeightMap2x4_0_0 from "@assets/sol/textures/earthHeightMap2x4/0_0.png";
import earthHeightMap2x4_0_1 from "@assets/sol/textures/earthHeightMap2x4/0_1.png";
import earthHeightMap2x4_0_2 from "@assets/sol/textures/earthHeightMap2x4/0_2.png";
import earthHeightMap2x4_0_3 from "@assets/sol/textures/earthHeightMap2x4/0_3.png";
import earthHeightMap2x4_1_0 from "@assets/sol/textures/earthHeightMap2x4/1_0.png";
import earthHeightMap2x4_1_1 from "@assets/sol/textures/earthHeightMap2x4/1_1.png";
import earthHeightMap2x4_1_2 from "@assets/sol/textures/earthHeightMap2x4/1_2.png";
import earthHeightMap2x4_1_3 from "@assets/sol/textures/earthHeightMap2x4/1_3.png";
import earthHeightMap1x1 from "@assets/sol/textures/earthHeightMap8k.png";

export async function loadEarthHeightMap1x1(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<HeightMap1x1> {
    const earthHeightMap1x1Promise = loadTextureAsync("EarthHeightMap_1x1", earthHeightMap1x1, scene, progressMonitor);

    return {
        type: "1x1",
        texture: await earthHeightMap1x1Promise,
    };
}

export async function loadEarthHeightMap2x4(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<HeightMap2x4> {
    const earthHeightMapPromise_0_0 = loadTextureAsync(
        "EarthHeightMap_0_0",
        earthHeightMap2x4_0_0,
        scene,
        progressMonitor,
    );
    const earthHeightMapPromise_0_1 = loadTextureAsync(
        "EarthHeightMap_0_1",
        earthHeightMap2x4_0_1,
        scene,
        progressMonitor,
    );
    const earthHeightMapPromise_0_2 = loadTextureAsync(
        "EarthHeightMap_0_2",
        earthHeightMap2x4_0_2,
        scene,
        progressMonitor,
    );
    const earthHeightMapPromise_0_3 = loadTextureAsync(
        "EarthHeightMap_0_3",
        earthHeightMap2x4_0_3,
        scene,
        progressMonitor,
    );
    const earthHeightMapPromise_1_0 = loadTextureAsync(
        "EarthHeightMap_1_0",
        earthHeightMap2x4_1_0,
        scene,
        progressMonitor,
    );
    const earthHeightMapPromise_1_1 = loadTextureAsync(
        "EarthHeightMap_1_1",
        earthHeightMap2x4_1_1,
        scene,
        progressMonitor,
    );
    const earthHeightMapPromise_1_2 = loadTextureAsync(
        "EarthHeightMap_1_2",
        earthHeightMap2x4_1_2,
        scene,
        progressMonitor,
    );
    const earthHeightMapPromise_1_3 = loadTextureAsync(
        "EarthHeightMap_1_3",
        earthHeightMap2x4_1_3,
        scene,
        progressMonitor,
    );

    return {
        type: "2x4",
        textures: [
            [
                await earthHeightMapPromise_0_0,
                await earthHeightMapPromise_0_1,
                await earthHeightMapPromise_0_2,
                await earthHeightMapPromise_0_3,
            ],
            [
                await earthHeightMapPromise_1_0,
                await earthHeightMapPromise_1_1,
                await earthHeightMapPromise_1_2,
                await earthHeightMapPromise_1_3,
            ],
        ],
    };
}
