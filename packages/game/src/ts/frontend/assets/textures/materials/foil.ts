//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024-2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import albedoPath from "@assets/foil/Color.jpg";
import normalPath from "@assets/foil/NormalGL.jpg";
import roughnessPath from "@assets/foil/Roughness.jpg";

export type FoilTextures = {
    readonly albedo: Texture;
    readonly normal: Texture;
    readonly roughness: Texture;
};

/**
 * @param engine Engine used to create the textures.
 * @param progressMonitor Progress monitor notified as each image loads.
 * @returns Surface maps for rendering foil, with linear-space normal and roughness data.
 */
export async function loadFoilTextures(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<FoilTextures> {
    const [albedo, normal, roughness] = await Promise.all([
        loadTextureAsync("FoilAlbedo", albedoPath, engine, progressMonitor),
        loadTextureAsync("FoilNormal", normalPath, engine, progressMonitor),
        loadTextureAsync("FoilRoughness", roughnessPath, engine, progressMonitor),
    ]);
    normal.gammaSpace = false;
    roughness.gammaSpace = false;
    return { albedo, normal, roughness };
}
