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

import solarPanelAmbientOcclusionPath from "@assets/others_0013_2k_4LqXNJ/others_0013_ao_2k.jpg";
import solarPanelAlbedoPath from "@assets/others_0013_2k_4LqXNJ/others_0013_color_2k.jpg";
import solarPanelMetallicPath from "@assets/others_0013_2k_4LqXNJ/others_0013_metallic_2k.jpg";
import solarPanelNormalPath from "@assets/others_0013_2k_4LqXNJ/others_0013_normal_directx_2k.png";
import solarPanelRoughnessPath from "@assets/others_0013_2k_4LqXNJ/others_0013_roughness_2k.jpg";

export type SolarPanelTextures = {
    albedo: Texture;
    normal: Texture;
    metallic: Texture;
    roughness: Texture;
    ambientOcclusion: Texture;
};

export async function loadSolarPanelTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<SolarPanelTextures> {
    const albedoPromise = loadTextureAsync("SolarPanelAlbedo", solarPanelAlbedoPath, scene, progressMonitor);
    const normalPromise = loadTextureAsync("SolarPanelNormal", solarPanelNormalPath, scene, progressMonitor);
    const metallicPromise = loadTextureAsync("SolarPanelMetallic", solarPanelMetallicPath, scene, progressMonitor);
    const roughnessPromise = loadTextureAsync("SolarPanelRoughness", solarPanelRoughnessPath, scene, progressMonitor);
    const ambientOcclusionPromise = loadTextureAsync(
        "SolarPanelAmbientOcclusion",
        solarPanelAmbientOcclusionPath,
        scene,
        progressMonitor,
    );

    return {
        albedo: await albedoPromise,
        normal: await normalPromise,
        metallic: await metallicPromise,
        roughness: await roughnessPromise,
        ambientOcclusion: await ambientOcclusionPromise,
    };
}
