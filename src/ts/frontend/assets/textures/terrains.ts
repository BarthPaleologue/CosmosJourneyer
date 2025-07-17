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

import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadTextureAsync } from "./utils";

import grassAlbedoRoughnessMap from "@assets/grassMaterial/wispy-grass-meadow_albedo_roughness.webp";
import grassNormalMetallicMap from "@assets/grassMaterial/wispy-grass-meadow_normal_metallic.webp";
import snowAlbedoRoughnessMap from "@assets/iceMaterial/ice_field_albedo_roughness.webp";
import snowNormalMetallicMap from "@assets/iceMaterial/ice_field_normal_metallic.webp";
import rockAlbedoRoughnessMap from "@assets/rockMaterial/layered-planetary_albedo_roughness.webp";
import rockNormalMetallicMap from "@assets/rockMaterial/layered-planetary_normal_metallic.webp";
import sandAlbedoRoughnessMap from "@assets/sandMaterial/wavy-sand_albedo_roughness.webp";
import sandNormalMetallicMap from "@assets/sandMaterial/wavy-sand_normal_metallic.webp";

export type TerrainTextures = {
    normalMetallic: Texture;
    albedoRoughness: Texture;
};

export type AllTerrainTextures = {
    rock: TerrainTextures;
    grass: TerrainTextures;
    snow: TerrainTextures;
    sand: TerrainTextures;
};

export async function loadTerrainTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<AllTerrainTextures> {
    const rockNormalMetallicPromise = loadTextureAsync(
        "RockNormalMetallicMap",
        rockNormalMetallicMap,
        scene,
        progressMonitor,
    );
    const rockAlbedoRoughnessPromise = loadTextureAsync(
        "RockAlbedoRoughnessMap",
        rockAlbedoRoughnessMap,
        scene,
        progressMonitor,
    );

    const grassNormalMetallicPromise = loadTextureAsync(
        "GrassNormalMetallicMap",
        grassNormalMetallicMap,
        scene,
        progressMonitor,
    );
    const grassAlbedoRoughnessPromise = loadTextureAsync(
        "GrassAlbedoRoughnessMap",
        grassAlbedoRoughnessMap,
        scene,
        progressMonitor,
    );

    const snowNormalMetallicPromise = loadTextureAsync(
        "SnowNormalMetallicMap",
        snowNormalMetallicMap,
        scene,
        progressMonitor,
    );
    const snowAlbedoRoughnessPromise = loadTextureAsync(
        "SnowAlbedoRoughness",
        snowAlbedoRoughnessMap,
        scene,
        progressMonitor,
    );

    const sandNormalMetallicPromise = loadTextureAsync(
        "SandNormalMetallicMap",
        sandNormalMetallicMap,
        scene,
        progressMonitor,
    );
    const sandAlbedoRoughnessPromise = loadTextureAsync(
        "SandAlbedoRoughnessMap",
        sandAlbedoRoughnessMap,
        scene,
        progressMonitor,
    );

    return {
        rock: {
            normalMetallic: await rockNormalMetallicPromise,
            albedoRoughness: await rockAlbedoRoughnessPromise,
        },
        grass: {
            normalMetallic: await grassNormalMetallicPromise,
            albedoRoughness: await grassAlbedoRoughnessPromise,
        },
        snow: {
            normalMetallic: await snowNormalMetallicPromise,
            albedoRoughness: await snowAlbedoRoughnessPromise,
        },
        sand: {
            normalMetallic: await sandNormalMetallicPromise,
            albedoRoughness: await sandAlbedoRoughnessPromise,
        },
    };
}
