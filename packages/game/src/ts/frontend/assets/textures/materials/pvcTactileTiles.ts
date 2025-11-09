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

import aoPath from "@assets/tiles_0011_2k_CN4UaB/tiles_0011_ao_2k.jpg";
import albedoPath from "@assets/tiles_0011_2k_CN4UaB/tiles_0011_color_2k.jpg";
import normalPath from "@assets/tiles_0011_2k_CN4UaB/tiles_0011_normal_opengl_2k.png";
import roughnessPath from "@assets/tiles_0011_2k_CN4UaB/tiles_0011_roughness_2k.jpg";

export type PvcTactileTilesTextures = {
    albedo: Texture;
    normal: Texture;
    roughness: Texture;
    ambientOcclusion: Texture;
};

export async function loadPvcTactileTilesTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<PvcTactileTilesTextures> {
    const albedoPromise = loadTextureAsync("PvcTactileTilesAlbedo", albedoPath, scene, progressMonitor);
    const normalPromise = loadTextureAsync("PvcTactileTilesNormal", normalPath, scene, progressMonitor);
    const roughnessPromise = loadTextureAsync("PvcTactileTilesRoughness", roughnessPath, scene, progressMonitor);
    const ambientOcclusionPromise = loadTextureAsync("PvcTactileTilesAmbientOcclusion", aoPath, scene, progressMonitor);

    return {
        albedo: await albedoPromise,
        normal: await normalPromise,
        roughness: await roughnessPromise,
        ambientOcclusion: await ambientOcclusionPromise,
    };
}
