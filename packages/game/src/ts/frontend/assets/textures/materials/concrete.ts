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

import type { PBRTextures } from ".";
import type { ILoadingProgressMonitor } from "../../loadingProgressMonitor";
import { loadTextureAsync } from "../utils";

import concreteAlbedo from "@assets/degraded-concrete-ue/degraded-concrete_albedo.webp";
import concreteAmbientOcclusion from "@assets/degraded-concrete-ue/degraded-concrete_ao.webp";
import concreteMetallicRoughness from "@assets/degraded-concrete-ue/degraded-concrete_metallic_roughness.webp";
import concreteNormal from "@assets/degraded-concrete-ue/degraded-concrete_normal-dx.webp";

export async function loadConcreteTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<PBRTextures> {
    const albedo = loadTextureAsync("ConcreteAlbedo", concreteAlbedo, scene, progressMonitor);
    const normal = loadTextureAsync("ConcreteNormal", concreteNormal, scene, progressMonitor);
    const metallicRoughness = loadTextureAsync(
        "ConcreteMetallicRoughness",
        concreteMetallicRoughness,
        scene,
        progressMonitor,
    );
    const ambientOcclusion = loadTextureAsync(
        "ConcreteAmbientOcclusion",
        concreteAmbientOcclusion,
        scene,
        progressMonitor,
    );

    return {
        albedo: await albedo,
        normal: await normal,
        metallicRoughness: await metallicRoughness,
        ambientOcclusion: await ambientOcclusion,
    };
}
