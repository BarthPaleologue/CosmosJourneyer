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

import { type CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadGasPlanetTextures, type GasPlanetTextures } from "./gasPlanet";
import { loadMaterialTextures, type AllMaterialTextures } from "./materials";
import { loadParticleTextures, type ParticleTextures } from "./particles";
import { loadRingsTextures, type RingsTextures } from "./rings";
import { loadTerrainTextures, type AllTerrainTextures } from "./terrains";
import { createTexturePools, type TexturePools } from "./texturePools";
import { loadCubeTextureAsync, loadTextureAsync } from "./utils";
import { loadWaterTextures, type WaterTextures } from "./water";

import empty from "@assets/oneBlackPixel.webp";
import seamlessPerlin from "@assets/perlin.webp";
import skyBox from "@assets/skybox/milkyway.env";
import cursorImage from "@assets/textures/hoveredCircle.png";

// Define texture groups types

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
    const emptyTexturePromise = loadTextureAsync("EmptyTexture", empty, scene, progressMonitor);

    // Environment textures
    const seamlessPerlinPromise = loadTextureAsync("SeamlessPerlin", seamlessPerlin, scene, progressMonitor);
    const milkyWayPromise = loadCubeTextureAsync("SkyBox", skyBox, scene, progressMonitor);

    const terrainTexturesPromise = loadTerrainTextures(scene, progressMonitor);
    const particleTexturesPromise = loadParticleTextures(scene, progressMonitor);
    const materialTexturesPromise = loadMaterialTextures(scene, progressMonitor);
    const gasPlanetTexturesPromise = loadGasPlanetTextures(scene, progressMonitor);
    const ringsTexturesPromise = loadRingsTextures(scene, progressMonitor);

    const waterTexturesPormise = loadWaterTextures(scene, progressMonitor);

    // Assemble and return the textures structure
    return {
        terrains: await terrainTexturesPromise,
        water: await waterTexturesPormise,
        particles: await particleTexturesPromise,
        materials: await materialTexturesPromise,
        gasPlanet: await gasPlanetTexturesPromise,
        rings: await ringsTexturesPromise,
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
