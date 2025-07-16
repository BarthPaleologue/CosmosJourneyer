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

import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Helpers/sceneHelpers";

import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";

import { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { GasPlanetTextures, loadGasPlanetTextures } from "./gasPlanet";
import { AllMaterialTextures, loadMaterialTextures } from "./materials";
import { loadRingsTextures, RingsTextures } from "./rings";
import { AllTerrainTextures, loadTerrainTextures } from "./terrains";
import { createTexturePools, TexturePools } from "./texturePools";
import { loadCubeTextureAsync, loadTextureAsync } from "./utils";

import butterflyTexture from "@assets/butterfly.webp";
import flareParticle from "@assets/flare.png";
import empty from "@assets/oneBlackPixel.webp";
import seamlessPerlin from "@assets/perlin.webp";
import skyBox from "@assets/skybox/milkyway.env";
import cursorImage from "@assets/textures/hoveredCircle.png";
import plumeParticle from "@assets/textures/plume.png";
import waterNormal1 from "@assets/textures/waterNormalMap3.jpg";
import waterNormal2 from "@assets/textures/waterNormalMap4.jpg";

// Define texture groups types

export type WaterTextures = {
    normalMap1: Texture;
    normalMap2: Texture;
};

export type ParticleTextures = {
    plume: Texture;
    flare: Texture;
    butterfly: Texture;
};

export type NoiseTextures = {
    seamlessPerlin: Texture;
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
 * @param scene - The scene to load textures into
 * @param progressMonitor - The progress monitor to report loading progress
 * @returns A promise resolving to the Textures object
 */
export async function loadTextures(scene: Scene, progressMonitor: ILoadingProgressMonitor | null): Promise<Textures> {
    // Water textures
    const waterNormalMap1Promise = loadTextureAsync("WaterNormalMap1", waterNormal1, scene, progressMonitor);
    const waterNormalMap2Promise = loadTextureAsync("WaterNormalMap2", waterNormal2, scene, progressMonitor);

    // Particle textures
    const plumeParticlePromise = loadTextureAsync("PlumeParticle", plumeParticle, scene, progressMonitor);
    const flareTexturePromise = loadTextureAsync("FlareTexture", flareParticle, scene, progressMonitor);

    // UI textures
    const butterflyPromise = loadTextureAsync("Butterfly", butterflyTexture, scene, progressMonitor);
    const emptyTexturePromise = loadTextureAsync("EmptyTexture", empty, scene, progressMonitor);

    // Environment textures
    const seamlessPerlinPromise = loadTextureAsync("SeamlessPerlin", seamlessPerlin, scene, progressMonitor);
    const milkyWayPromise = loadCubeTextureAsync("SkyBox", skyBox, scene, progressMonitor);

    // Assemble and return the textures structure
    return {
        terrains: await loadTerrainTextures(scene, progressMonitor),
        water: {
            normalMap1: await waterNormalMap1Promise,
            normalMap2: await waterNormalMap2Promise,
        },
        particles: {
            plume: await plumeParticlePromise,
            flare: await flareTexturePromise,
            butterfly: await butterflyPromise,
        },
        materials: await loadMaterialTextures(scene, progressMonitor),
        gasPlanet: await loadGasPlanetTextures(scene, progressMonitor),
        rings: await loadRingsTextures(scene, progressMonitor),
        environment: {
            milkyWay: await milkyWayPromise,
        },
        noises: {
            seamlessPerlin: await seamlessPerlinPromise,
        },
        ui: {
            cursorImageUrl: cursorImage,
        },
        empty: await emptyTexturePromise,
        pools: createTexturePools(scene),
    };
}
