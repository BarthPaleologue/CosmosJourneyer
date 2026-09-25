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

import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadEnvironmentTextures } from "./environment";
import { loadGasPlanetTextures } from "./gasPlanet";
import type { GasPlanetTextures } from "./gasPlanet";
import { loadMaterialTextures } from "./materials";
import type { AllMaterialTextures } from "./materials";
import { loadNoiseTextures } from "./noises";
import type { NoiseTextures } from "./noises";
import { loadParticleTextures } from "./particles";
import type { ParticleTextures } from "./particles";
import { loadRingsTextures } from "./rings";
import type { RingsTextures } from "./rings";
import { loadTerrainTextures } from "./terrains";
import type { AllTerrainTextures } from "./terrains";
import { createTexturePools } from "./texturePools";
import type { TexturePools } from "./texturePools";
import { loadTextureAsync } from "./utils";

import empty from "@assets/oneBlackPixel.webp";
import cursorImage from "@assets/textures/hoveredCircle.png";
import waterNormal1 from "@assets/textures/waterNormalMap3.jpg";
import waterNormal2 from "@assets/textures/waterNormalMap4.jpg";

// Define texture groups types

export type WaterTextures = {
    normalMap1: Texture;
    normalMap2: Texture;
};

export type Textures = {
    readonly terrains: Readonly<AllTerrainTextures>;
    readonly water: Readonly<WaterTextures>;
    readonly particles: Readonly<ParticleTextures>;
    readonly materials: Readonly<AllMaterialTextures>;
    readonly gasPlanet: Readonly<GasPlanetTextures>;
    readonly rings: Readonly<RingsTextures>;
    readonly environment: {
        readonly milkyWay: CubeTexture;
    };
    readonly noises: NoiseTextures;
    readonly ui: {
        readonly cursorImageUrl: string;
    };
    readonly empty: Texture;
    readonly pools: Readonly<TexturePools>;
};

/**
 * Loads all textures required by the game
 * @param scene - The scene used to create scene-owned textures
 * @param engine - The engine used to load regular textures
 * @param progressMonitor - The progress monitor to report loading progress
 * @returns A promise resolving to the Textures object
 */
export async function loadTextures(
    scene: Scene,
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Textures> {
    // Water textures
    const waterNormalMap1Promise = loadTextureAsync("WaterNormalMap1", waterNormal1, engine, progressMonitor);
    const waterNormalMap2Promise = loadTextureAsync("WaterNormalMap2", waterNormal2, engine, progressMonitor);

    const emptyTexturePromise = loadTextureAsync("EmptyTexture", empty, engine, progressMonitor);

    const environmentPromise = loadEnvironmentTextures(scene, progressMonitor);

    const terrainTexturesPromise = loadTerrainTextures(engine, progressMonitor);
    const particleTexturesPromise = loadParticleTextures(engine, progressMonitor);
    const materialTexturesPromise = loadMaterialTextures(engine, progressMonitor);
    const gasPlanetTexturesPromise = loadGasPlanetTextures(engine, progressMonitor);
    const ringsTexturesPromise = loadRingsTextures(engine, progressMonitor);

    const noiseTexturesPromise = loadNoiseTextures(engine, progressMonitor);

    // Assemble and return the textures structure
    return {
        terrains: await terrainTexturesPromise,
        water: {
            normalMap1: await waterNormalMap1Promise,
            normalMap2: await waterNormalMap2Promise,
        },
        particles: await particleTexturesPromise,
        materials: await materialTexturesPromise,
        gasPlanet: await gasPlanetTexturesPromise,
        rings: await ringsTexturesPromise,
        environment: await environmentPromise,
        noises: await noiseTexturesPromise,
        ui: {
            cursorImageUrl: cursorImage,
        },
        empty: await emptyTexturePromise,
        pools: createTexturePools(scene),
    };
}
