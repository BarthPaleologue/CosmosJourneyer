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

import ambientOcclusionPath from "@assets/materials/Foil003_2K-JPG/Foil003_2K-JPG_AmbientOcclusion.jpg";
import albedoPath from "@assets/materials/Foil003_2K-JPG/Foil003_2K-JPG_Color.jpg";
import metallicPath from "@assets/materials/Foil003_2K-JPG/Foil003_2K-JPG_Metalness.jpg";
import normalPath from "@assets/materials/Foil003_2K-JPG/Foil003_2K-JPG_NormalDX.jpg";
import roughnessPath from "@assets/materials/Foil003_2K-JPG/Foil003_2K-JPG_Roughness.jpg";

export async function loadFoilMaterialTextures(scene: Scene, progressMonitor: ILoadingProgressMonitor | null) {
    const albedoPromise = loadTextureAsync("FoilAlbedo", albedoPath, scene, progressMonitor);
    const normalPromise = loadTextureAsync("FoilNormal", normalPath, scene, progressMonitor);
    const metallicPromise = loadTextureAsync("FoilMetallic", metallicPath, scene, progressMonitor);
    const roughnessPromise = loadTextureAsync("FoilRoughness", roughnessPath, scene, progressMonitor);
    const ambientOcclusionPromise = loadTextureAsync(
        "FoilAmbientOcclusion",
        ambientOcclusionPath,
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
