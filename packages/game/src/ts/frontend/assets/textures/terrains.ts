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

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadTextureAsync } from "./utils";

import grassAlbedoRoughnessMap from "@assets/grassMaterial/wispy-grass-meadow_albedo_roughness.webp";
import grassNormalAmbientOcclusionMap from "@assets/grassMaterial/wispy-grass-meadow_normal_ambient_occlusion.webp";
import snowAlbedoRoughnessMap from "@assets/iceMaterial/ice_field_albedo_roughness.webp";
import snowNormalAmbientOcclusionMap from "@assets/iceMaterial/ice_field_normal_ambient_occlusion.webp";
import rockAlbedoRoughnessMap from "@assets/rockMaterial/layered-planetary_albedo_roughness.webp";
import rockNormalAmbientOcclusionMap from "@assets/rockMaterial/layered-planetary_normal_ambient_occlusion.webp";
import sandAlbedoRoughnessMap from "@assets/sandMaterial/wavy-sand_albedo_roughness.webp";
import sandNormalAmbientOcclusionMap from "@assets/sandMaterial/wavy-sand_normal_ambient_occlusion.webp";

export type TerrainTextures = {
    normalAmbientOcclusion: Texture;
    albedoRoughness: Texture;
};

export type AllTerrainTextures = {
    rock: TerrainTextures;
    grass: TerrainTextures;
    snow: TerrainTextures;
    sand: TerrainTextures;
};

export async function loadTerrainTextures(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<AllTerrainTextures> {
    const rockNormalAmbientOcclusionPromise = loadTextureAsync(
        "RockNormalAmbientOcclusionMap",
        rockNormalAmbientOcclusionMap,
        engine,
        progressMonitor,
    );
    const rockAlbedoRoughnessPromise = loadTextureAsync(
        "RockAlbedoRoughnessMap",
        rockAlbedoRoughnessMap,
        engine,
        progressMonitor,
    );

    const grassNormalAmbientOcclusionPromise = loadTextureAsync(
        "GrassNormalAmbientOcclusionMap",
        grassNormalAmbientOcclusionMap,
        engine,
        progressMonitor,
    );
    const grassAlbedoRoughnessPromise = loadTextureAsync(
        "GrassAlbedoRoughnessMap",
        grassAlbedoRoughnessMap,
        engine,
        progressMonitor,
    );

    const snowNormalAmbientOcclusionPromise = loadTextureAsync(
        "SnowNormalAmbientOcclusionMap",
        snowNormalAmbientOcclusionMap,
        engine,
        progressMonitor,
    );
    const snowAlbedoRoughnessPromise = loadTextureAsync(
        "SnowAlbedoRoughness",
        snowAlbedoRoughnessMap,
        engine,
        progressMonitor,
    );

    const sandNormalAmbientOcclusionPromise = loadTextureAsync(
        "SandNormalAmbientOcclusionMap",
        sandNormalAmbientOcclusionMap,
        engine,
        progressMonitor,
    );
    const sandAlbedoRoughnessPromise = loadTextureAsync(
        "SandAlbedoRoughnessMap",
        sandAlbedoRoughnessMap,
        engine,
        progressMonitor,
    );

    return {
        rock: {
            normalAmbientOcclusion: await rockNormalAmbientOcclusionPromise,
            albedoRoughness: await rockAlbedoRoughnessPromise,
        },
        grass: {
            normalAmbientOcclusion: await grassNormalAmbientOcclusionPromise,
            albedoRoughness: await grassAlbedoRoughnessPromise,
        },
        snow: {
            normalAmbientOcclusion: await snowNormalAmbientOcclusionPromise,
            albedoRoughness: await snowAlbedoRoughnessPromise,
        },
        sand: {
            normalAmbientOcclusion: await sandNormalAmbientOcclusionPromise,
            albedoRoughness: await sandAlbedoRoughnessPromise,
        },
    };
}
