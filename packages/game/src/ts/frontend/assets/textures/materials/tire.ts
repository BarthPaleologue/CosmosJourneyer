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

import tireAOPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_ao_2k.jpg";
import tireAlbedoPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_color_2k.jpg";
import tireMetallicPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_metallic_2k.jpg";
import tireNormalPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_normal_direct_2k.png";
import tireOpacityPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_opacity_2k.jpg";
import tireRoughnessPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_roughness_2k.jpg";

export type TireTextures = {
    albedo: Texture;
    normal: Texture;
    metallic: Texture;
    roughness: Texture;
    ambientOcclusion: Texture;
    opacity: Texture;
};

export async function loadTireTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<TireTextures> {
    const albedoPromise = loadTextureAsync("TireAlbedo", tireAlbedoPath, scene, progressMonitor);
    const normalPromise = loadTextureAsync("TireNormal", tireNormalPath, scene, progressMonitor);
    const metallicPromise = loadTextureAsync("TireMetallic", tireMetallicPath, scene, progressMonitor);
    const roughnessPromise = loadTextureAsync("TireRoughness", tireRoughnessPath, scene, progressMonitor);
    const ambientOcclusionPromise = loadTextureAsync("TireAmbientOcclusion", tireAOPath, scene, progressMonitor);
    const opacityPromise = loadTextureAsync("TireOpacity", tireOpacityPath, scene, progressMonitor);

    return {
        albedo: await albedoPromise,
        normal: await normalPromise,
        metallic: await metallicPromise,
        roughness: await roughnessPromise,
        ambientOcclusion: await ambientOcclusionPromise,
        opacity: await opacityPromise,
    };
}
