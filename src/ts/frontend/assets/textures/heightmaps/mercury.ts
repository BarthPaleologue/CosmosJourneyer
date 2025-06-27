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
import { type HeightMap1x1 } from "./types";

import mercuryHeightMap1x1 from "@assets/sol/textures/mercuryHeightMap8k.png";

export async function loadMercuryHeightMap1x1(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<HeightMap1x1> {
    return {
        type: "1x1",
        texture: await loadTextureAsync("mercuryHeightMap1x1", mercuryHeightMap1x1, scene, progressMonitor),
    };
}
