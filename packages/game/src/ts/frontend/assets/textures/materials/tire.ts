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

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";

import type { ILoadingProgressMonitor } from "../../loadingProgressMonitor";
import { loadTextureAsync } from "../utils";

import tireAOPath from "@assets/plastic_0022_2k_TKmv2N/plastic_0022_ao_2k.jpg";
import tireAlbedoPath from "@assets/plastic_0022_2k_TKmv2N/plastic_0022_color_2k.jpg";
import tireNormalHeightPath from "@assets/plastic_0022_2k_TKmv2N/plastic_0022_normal_height_2k.png";
import tireRoughnessPath from "@assets/plastic_0022_2k_TKmv2N/plastic_0022_roughness_2k.jpg";

export type TireTextures = {
    albedo: Texture;
    normalHeight: Texture;
    roughness: Texture;
    ambientOcclusion: Texture;
};

export async function loadTireTextures(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<TireTextures> {
    const albedoPromise = loadTextureAsync("TireAlbedo", tireAlbedoPath, engine, progressMonitor);
    const normalHeightPromise = loadTextureAsync("TireNormalHeight", tireNormalHeightPath, engine, progressMonitor);
    const roughnessPromise = loadTextureAsync("TireRoughness", tireRoughnessPath, engine, progressMonitor);
    const ambientOcclusionPromise = loadTextureAsync("TireAmbientOcclusion", tireAOPath, engine, progressMonitor);

    return {
        albedo: await albedoPromise,
        normalHeight: await normalHeightPromise,
        roughness: await roughnessPromise,
        ambientOcclusion: await ambientOcclusionPromise,
    };
}
