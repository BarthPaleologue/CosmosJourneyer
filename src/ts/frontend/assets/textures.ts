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

import { RingsLut } from "@/frontend/rings/ringsLut";

import { ItemPool } from "@/utils/itemPool";

import { CloudsLut } from "../clouds/cloudsLut";
import { TelluricPlanetMaterialLut } from "../planets/telluricPlanet/telluricPlanetMaterialLut";
import { StarMaterialLut } from "../stellarObjects/star/starMaterialLut";
import { LandingPadTexturePool } from "./landingPadTexturePool";

import butterflyTexture from "@assets/butterfly.webp";
import crateAlbedo from "@assets/crateMaterial/space-crate1-albedo.webp";
import crateAmbientOcclusion from "@assets/crateMaterial/space-crate1-ao.webp";
import crateMetallicRoughness from "@assets/crateMaterial/space-crate1-metallic-roughness.webp";
import crateNormal from "@assets/crateMaterial/space-crate1-normal-dx.webp";
import concreteAlbedo from "@assets/degraded-concrete-ue/degraded-concrete_albedo.webp";
import concreteAmbientOcclusion from "@assets/degraded-concrete-ue/degraded-concrete_ao.webp";
import concreteMetallicRoughness from "@assets/degraded-concrete-ue/degraded-concrete_metallic_roughness.webp";
import concreteNormal from "@assets/degraded-concrete-ue/degraded-concrete_normal-dx.webp";
import flareParticle from "@assets/flare.png";
import grassAlbedoRoughnessMap from "@assets/grassMaterial/wispy-grass-meadow_albedo_roughness.webp";
import grassNormalMetallicMap from "@assets/grassMaterial/wispy-grass-meadow_normal_metallic.webp";
import snowAlbedoRoughnessMap from "@assets/iceMaterial/ice_field_albedo_roughness.webp";
import snowNormalMetallicMap from "@assets/iceMaterial/ice_field_normal_metallic.webp";
import metalPanelsMetallicRoughness from "@assets/metalPanelMaterial/metallicRoughness.webp";
import metalPanelsAlbdeo from "@assets/metalPanelMaterial/sci-fi-panel1-albedo.webp";
import metalPanelsAmbientOcclusion from "@assets/metalPanelMaterial/sci-fi-panel1-ao.webp";
import metalPanelsNormal from "@assets/metalPanelMaterial/sci-fi-panel1-normal-dx.webp";
import empty from "@assets/oneBlackPixel.webp";
import seamlessPerlin from "@assets/perlin.webp";
import rockAlbedoRoughnessMap from "@assets/rockMaterial/layered-planetary_albedo_roughness.webp";
import rockNormalMetallicMap from "@assets/rockMaterial/layered-planetary_normal_metallic.webp";
import sandAlbedoRoughnessMap from "@assets/sandMaterial/wavy-sand_albedo_roughness.webp";
import sandNormalMetallicMap from "@assets/sandMaterial/wavy-sand_normal_metallic.webp";
import skyBox from "@assets/skybox/milkyway.env";
import solarPanelMetallicRoughness from "@assets/SolarPanelMaterial/metallicRougness.webp";
import solarPanelAlbedo from "@assets/SolarPanelMaterial/SolarPanel002_2K-PNG_Color.webp";
import solarPanelNormal from "@assets/SolarPanelMaterial/SolarPanel002_2K-PNG_NormalDX.webp";
import spaceStationMetallicRoughness from "@assets/spaceStationMaterial/metallicRoughness.webp";
import spaceStationAlbedo from "@assets/spaceStationMaterial/spaceship-panels1-albedo.webp";
import spaceStationAmbientOcclusion from "@assets/spaceStationMaterial/spaceship-panels1-ao.webp";
import spaceStationNormal from "@assets/spaceStationMaterial/spaceship-panels1-normal-dx.webp";
import cursorImage from "@assets/textures/hoveredCircle.png";
import plumeParticle from "@assets/textures/plume.png";
import waterNormal1 from "@assets/textures/waterNormalMap3.jpg";
import waterNormal2 from "@assets/textures/waterNormalMap4.jpg";
import treeTexturePath from "@assets/tree/Tree.png";

// Define texture groups types
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

export type PBRTextures = {
    albedo: Texture;
    normal: Texture;
    metallicRoughness: Texture;
    ambientOcclusion: Texture;
};

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

export type AllMaterialTextures = {
    solarPanel: Omit<PBRTextures, "ambientOcclusion">;
    spaceStation: PBRTextures;
    metalPanels: PBRTextures;
    concrete: PBRTextures;
    crate: PBRTextures;
    tree: Pick<PBRTextures, "albedo">;
};

export type TexturePools = {
    cloudsLut: ItemPool<CloudsLut>;
    ringsLut: ItemPool<RingsLut>;
    starMaterialLut: ItemPool<StarMaterialLut>;
    telluricPlanetMaterialLut: ItemPool<TelluricPlanetMaterialLut>;
    landingPad: LandingPadTexturePool;
};

export type Textures = {
    readonly terrains: Readonly<AllTerrainTextures>;
    readonly water: Readonly<WaterTextures>;
    readonly particles: Readonly<ParticleTextures>;
    readonly materials: Readonly<AllMaterialTextures>;
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
 * @param progressCallback - Callback function for loading progress
 * @param enumerateCallback - Callback function to notify of total number of textures
 * @param scene - The scene to load textures into
 * @returns A promise resolving to the Textures object
 */
export async function loadTextures(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void,
    scene: Scene,
): Promise<Textures> {
    let loadedCount = 0;
    let totalCount = 0;

    const loadTextureAsync = (name: string, url: string): Promise<Texture> => {
        const loadingPromise = new Promise<Texture>((resolve) => {
            const texture = new Texture(url, scene, false, false, undefined, () => {
                resolve(texture);
            });
            texture.name = name;
        });
        totalCount++;

        return loadingPromise.then((texture) => {
            progressCallback(++loadedCount, totalCount, texture.name);
            return texture;
        });
    };

    const loadCubeTextureAsync = (name: string, url: string): Promise<CubeTexture> => {
        const loadingPromise = new Promise<CubeTexture>((resolve) => {
            const texture = CubeTexture.CreateFromPrefilteredData(url, scene);
            texture.onLoadObservable.add(() => {
                resolve(texture);
            });
            texture.name = name;
        });
        totalCount++;

        return loadingPromise.then((texture) => {
            progressCallback(++loadedCount, totalCount, texture.name);
            return texture;
        });
    };

    // Terrain textures
    const rockNormalMetallicPromise = loadTextureAsync("RockNormalMetallicMap", rockNormalMetallicMap);
    const rockAlbedoRoughnessPromise = loadTextureAsync("RockAlbedoRoughnessMap", rockAlbedoRoughnessMap);

    const grassNormalMetallicPromise = loadTextureAsync("GrassNormalMetallicMap", grassNormalMetallicMap);
    const grassAlbedoRoughnessPromise = loadTextureAsync("GrassAlbedoRoughnessMap", grassAlbedoRoughnessMap);

    const snowNormalMetallicPromise = loadTextureAsync("SnowNormalMetallicMap", snowNormalMetallicMap);
    const snowAlbedoRoughnessPromise = loadTextureAsync("SnowAlbedoRoughness", snowAlbedoRoughnessMap);

    const sandNormalMetallicPromise = loadTextureAsync("SandNormalMetallicMap", sandNormalMetallicMap);
    const sandAlbedoRoughnessPromise = loadTextureAsync("SandAlbedoRoughnessMap", sandAlbedoRoughnessMap);

    // Water textures
    const waterNormalMap1Promise = loadTextureAsync("WaterNormalMap1", waterNormal1);
    const waterNormalMap2Promise = loadTextureAsync("WaterNormalMap2", waterNormal2);

    // Particle textures
    const plumeParticlePromise = loadTextureAsync("PlumeParticle", plumeParticle);
    const flareTexturePromise = loadTextureAsync("FlareTexture", flareParticle);

    // UI textures
    const butterflyPromise = loadTextureAsync("Butterfly", butterflyTexture);
    const emptyTexturePromise = loadTextureAsync("EmptyTexture", empty);

    // Environment textures
    const seamlessPerlinPromise = loadTextureAsync("SeamlessPerlin", seamlessPerlin);
    const milkyWayPromise = loadCubeTextureAsync("SkyBox", skyBox);

    // Material textures
    // Solar Panel
    const solarPanelAlbedoPromise = loadTextureAsync("SolarPanelAlbedo", solarPanelAlbedo);
    const solarPanelNormalPromise = loadTextureAsync("SolarPanelNormal", solarPanelNormal);
    const solarPanelMetallicRoughnessPromise = loadTextureAsync(
        "SolarPanelMetallicRoughness",
        solarPanelMetallicRoughness,
    );

    // Space Station
    const spaceStationAlbedoPromise = loadTextureAsync("SpaceStationAlbedo", spaceStationAlbedo);
    const spaceStationNormalPromise = loadTextureAsync("SpaceStationNormal", spaceStationNormal);
    const spaceStationMetallicRoughnessPromise = loadTextureAsync(
        "SpaceStationMetallicRoughness",
        spaceStationMetallicRoughness,
    );
    const spaceStationAmbientOcclusionPromise = loadTextureAsync(
        "SpaceStationAmbientOcclusion",
        spaceStationAmbientOcclusion,
    );

    // Metal Panels
    const metalPanelsAlbedoPromise = loadTextureAsync("MetalPanelsAlbedo", metalPanelsAlbdeo);
    const metalPanelsNormalPromise = loadTextureAsync("MetalPanelsNormal", metalPanelsNormal);
    const metalPanelsMetallicRoughnessPromise = loadTextureAsync(
        "MetalPanelsMetallicRoughness",
        metalPanelsMetallicRoughness,
    );
    const metalPanelsAmbientOcclusionPromise = loadTextureAsync(
        "MetalPanelsAmbientOcclusion",
        metalPanelsAmbientOcclusion,
    );

    const treeAlbedoPromise = loadTextureAsync("TreeAlbedo", treeTexturePath);

    // Concrete
    const concreteAlbedoPromise = loadTextureAsync("ConcreteAlbedo", concreteAlbedo);
    const concreteNormalPromise = loadTextureAsync("ConcreteNormal", concreteNormal);
    const concreteMetallicRoughnessPromise = loadTextureAsync("ConcreteMetallicRoughness", concreteMetallicRoughness);
    const concreteAmbientOcclusionPromise = loadTextureAsync("ConcreteAmbientOcclusion", concreteAmbientOcclusion);

    // Crate
    const crateAlbedoPromise = loadTextureAsync("CrateAlbedo", crateAlbedo);
    const crateNormalPromise = loadTextureAsync("CrateNormal", crateNormal);
    const crateMetallicRoughnessPromise = loadTextureAsync("CrateMetallicRoughness", crateMetallicRoughness);
    const crateAmbientOcclusionPromise = loadTextureAsync("CrateAmbientOcclusion", crateAmbientOcclusion);

    const treeAlbedo = await treeAlbedoPromise;
    treeAlbedo.hasAlpha = true;

    // Assemble and return the textures structure
    return {
        terrains: {
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
        },
        water: {
            normalMap1: await waterNormalMap1Promise,
            normalMap2: await waterNormalMap2Promise,
        },
        particles: {
            plume: await plumeParticlePromise,
            flare: await flareTexturePromise,
            butterfly: await butterflyPromise,
        },
        materials: {
            solarPanel: {
                albedo: await solarPanelAlbedoPromise,
                normal: await solarPanelNormalPromise,
                metallicRoughness: await solarPanelMetallicRoughnessPromise,
            },
            spaceStation: {
                albedo: await spaceStationAlbedoPromise,
                normal: await spaceStationNormalPromise,
                metallicRoughness: await spaceStationMetallicRoughnessPromise,
                ambientOcclusion: await spaceStationAmbientOcclusionPromise,
            },
            metalPanels: {
                albedo: await metalPanelsAlbedoPromise,
                normal: await metalPanelsNormalPromise,
                metallicRoughness: await metalPanelsMetallicRoughnessPromise,
                ambientOcclusion: await metalPanelsAmbientOcclusionPromise,
            },
            concrete: {
                albedo: await concreteAlbedoPromise,
                normal: await concreteNormalPromise,
                metallicRoughness: await concreteMetallicRoughnessPromise,
                ambientOcclusion: await concreteAmbientOcclusionPromise,
            },
            crate: {
                albedo: await crateAlbedoPromise,
                normal: await crateNormalPromise,
                metallicRoughness: await crateMetallicRoughnessPromise,
                ambientOcclusion: await crateAmbientOcclusionPromise,
            },
            tree: {
                albedo: treeAlbedo,
            },
        },
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

export function createTexturePools(scene: Scene): TexturePools {
    return {
        cloudsLut: new ItemPool<CloudsLut>(() => new CloudsLut(scene)),
        ringsLut: new ItemPool<RingsLut>(() => new RingsLut(scene)),
        starMaterialLut: new ItemPool<StarMaterialLut>(() => new StarMaterialLut(scene)),
        telluricPlanetMaterialLut: new ItemPool<TelluricPlanetMaterialLut>(() => new TelluricPlanetMaterialLut(scene)),
        landingPad: new LandingPadTexturePool(),
    };
}
