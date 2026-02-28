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

import albedoPath from "@assets/crateMaterial/space-crate1-albedo.webp";
import ambientOcclusionPath from "@assets/crateMaterial/space-crate1-ao.webp";
import metallicRoughnessPath from "@assets/crateMaterial/space-crate1-metallic-roughness.webp";
import normalHeightPath from "@assets/crateMaterial/space-crate1-normal-dx-height.webp";

export type CrateTextures = {
    albedo: Texture;
    normalHeight: Texture;
    metallicRoughness: Texture;
    ambientOcclusion: Texture;
};

export async function loadCrateTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<CrateTextures> {
    const albedoPromise = loadTextureAsync("crateAlbedo", albedoPath, scene, progressMonitor);
    const normalHeightPromise = loadTextureAsync("crateNormalHeight", normalHeightPath, scene, progressMonitor);
    const metallicRoughnessPromise = loadTextureAsync(
        "crateMetallicRoughness",
        metallicRoughnessPath,
        scene,
        progressMonitor,
    );
    const ambientOcclusionPromise = loadTextureAsync(
        "crateAmbientOcclusion",
        ambientOcclusionPath,
        scene,
        progressMonitor,
    );

    return {
        albedo: await albedoPromise,
        normalHeight: await normalHeightPromise,
        metallicRoughness: await metallicRoughnessPromise,
        ambientOcclusion: await ambientOcclusionPromise,
    };
}
