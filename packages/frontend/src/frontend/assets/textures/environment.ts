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

import type { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import type { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadCubeTextureAsync } from "./utils";

import milkyWay from "@assets/skybox/milkyway.env";

export type EnvironmentTextures = {
    readonly milkyWay: CubeTexture;
};

export async function loadEnvironmentTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<EnvironmentTextures> {
    const milkyWayPromise = loadCubeTextureAsync("SkyBox", milkyWay, scene, progressMonitor);
    const milkyWayTexture = await milkyWayPromise;
    milkyWayTexture.gammaSpace = true;

    return {
        milkyWay: milkyWayTexture,
    };
}
