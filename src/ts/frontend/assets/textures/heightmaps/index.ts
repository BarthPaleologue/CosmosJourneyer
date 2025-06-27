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
import { loadEarthHeightMap1x1, loadEarthHeightMap2x4 } from "./earth";
import { loadMarsHeightMap1x1, loadMarsHeightMapHighResolution } from "./mars";
import { loadMercuryHeightMap1x1 } from "./mercury";
import type { HeightMap1x1, HeightMap2x4 } from "./types";

export type HeightMaps = {
    mercury1x1: Readonly<HeightMap1x1>;
    earth1x1: Readonly<HeightMap1x1>;
    earth2x4: Readonly<HeightMap2x4>;
    mars1x1: Readonly<HeightMap1x1>;
    mars2x4: Readonly<HeightMap2x4>;
};

export async function loadHeightMaps(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<HeightMaps> {
    const heightMaps: HeightMaps = {
        mercury1x1: await loadMercuryHeightMap1x1(scene, progressMonitor),
        earth1x1: await loadEarthHeightMap1x1(scene, progressMonitor),
        earth2x4: await loadEarthHeightMap2x4(scene, progressMonitor),
        mars1x1: await loadMarsHeightMap1x1(scene, progressMonitor),
        mars2x4: await loadMarsHeightMapHighResolution(scene, progressMonitor),
    };

    return heightMaps;
}
