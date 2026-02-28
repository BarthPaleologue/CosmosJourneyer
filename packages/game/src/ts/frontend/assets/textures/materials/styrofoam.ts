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

import type { ILoadingProgressMonitor } from "../../loadingProgressMonitor";
import { loadTextureAsync } from "../utils";

import albedoPath from "@assets/styrofoam-bl/styrofoam_albedo.png";
import aoPath from "@assets/styrofoam-bl/styrofoam_ao.png";
import normalPath from "@assets/styrofoam-bl/styrofoam_normal-ogl.png";
import roughnessPath from "@assets/styrofoam-bl/styrofoam_roughness.png";

export type StyroFoamTextures = {
    albedo: Texture;
    normal: Texture;
    roughness: Texture;
    ambientOcclusion: Texture;
};

export async function loadStyroFoamTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<StyroFoamTextures> {
    const albedoPromise = loadTextureAsync("StyroFoamAlbedo", albedoPath, scene, progressMonitor);
    const normalPromise = loadTextureAsync("StyroFoamNormal", normalPath, scene, progressMonitor);
    const roughnessPromise = loadTextureAsync("StyroFoamRoughness", roughnessPath, scene, progressMonitor);
    const ambientOcclusionPromise = loadTextureAsync("StyroFoamAmbientOcclusion", aoPath, scene, progressMonitor);

    return {
        albedo: await albedoPromise,
        normal: await normalPromise,
        roughness: await roughnessPromise,
        ambientOcclusion: await ambientOcclusionPromise,
    };
}
