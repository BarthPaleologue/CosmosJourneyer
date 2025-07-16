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
import { createTexturePools, TexturePools } from "./texturePools";
import { loadCubeTextureAsync, loadTextureAsync } from "./utils";

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
import metalPanelsAlbedo from "@assets/metalPanelMaterial/sci-fi-panel1-albedo.webp";
import metalPanelsAmbientOcclusion from "@assets/metalPanelMaterial/sci-fi-panel1-ao.webp";
import metalPanelsNormal from "@assets/metalPanelMaterial/sci-fi-panel1-normal-dx.webp";
import empty from "@assets/oneBlackPixel.webp";
import seamlessPerlin from "@assets/perlin.webp";
import rockAlbedoRoughnessMap from "@assets/rockMaterial/layered-planetary_albedo_roughness.webp";
import rockNormalMetallicMap from "@assets/rockMaterial/layered-planetary_normal_metallic.webp";
import sandAlbedoRoughnessMap from "@assets/sandMaterial/wavy-sand_albedo_roughness.webp";
import sandNormalMetallicMap from "@assets/sandMaterial/wavy-sand_normal_metallic.webp";
import skyBox from "@assets/skybox/milkyway.env";
import jupiterTexturePath from "@assets/sol/textures/jupiter.jpg";
import neptuneTexturePath from "@assets/sol/textures/neptune.jpg";
import saturnRingsPath from "@assets/sol/textures/saturn_rings.png";
import saturnTexturePath from "@assets/sol/textures/saturn.jpg";
import uranusRingsPath from "@assets/sol/textures/uranus_rings.png";
import uranusTexturePath from "@assets/sol/textures/uranus.jpg";
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

export type GasPlanetTextures = {
    jupiter: Texture;
    saturn: Texture;
    uranus: Texture;
    neptune: Texture;
};

export type RingsTextures = {
    saturn: Texture;
    uranus: Texture;
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
    // Terrain textures
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

    // Material textures
    // Solar Panel
    const solarPanelAlbedoPromise = loadTextureAsync("SolarPanelAlbedo", solarPanelAlbedo, scene, progressMonitor);
    const solarPanelNormalPromise = loadTextureAsync("SolarPanelNormal", solarPanelNormal, scene, progressMonitor);
    const solarPanelMetallicRoughnessPromise = loadTextureAsync(
        "SolarPanelMetallicRoughness",
        solarPanelMetallicRoughness,
        scene,
        progressMonitor,
    );

    // Space Station
    const spaceStationAlbedoPromise = loadTextureAsync(
        "SpaceStationAlbedo",
        spaceStationAlbedo,
        scene,
        progressMonitor,
    );
    const spaceStationNormalPromise = loadTextureAsync(
        "SpaceStationNormal",
        spaceStationNormal,
        scene,
        progressMonitor,
    );
    const spaceStationMetallicRoughnessPromise = loadTextureAsync(
        "SpaceStationMetallicRoughness",
        spaceStationMetallicRoughness,
        scene,
        progressMonitor,
    );
    const spaceStationAmbientOcclusionPromise = loadTextureAsync(
        "SpaceStationAmbientOcclusion",
        spaceStationAmbientOcclusion,
        scene,
        progressMonitor,
    );

    // Metal Panels
    const metalPanelsAlbedoPromise = loadTextureAsync("MetalPanelsAlbedo", metalPanelsAlbedo, scene, progressMonitor);
    const metalPanelsNormalPromise = loadTextureAsync("MetalPanelsNormal", metalPanelsNormal, scene, progressMonitor);
    const metalPanelsMetallicRoughnessPromise = loadTextureAsync(
        "MetalPanelsMetallicRoughness",
        metalPanelsMetallicRoughness,
        scene,
        progressMonitor,
    );
    const metalPanelsAmbientOcclusionPromise = loadTextureAsync(
        "MetalPanelsAmbientOcclusion",
        metalPanelsAmbientOcclusion,
        scene,
        progressMonitor,
    );

    const treeAlbedoPromise = loadTextureAsync("TreeAlbedo", treeTexturePath, scene, progressMonitor);

    // Concrete
    const concreteAlbedoPromise = loadTextureAsync("ConcreteAlbedo", concreteAlbedo, scene, progressMonitor);
    const concreteNormalPromise = loadTextureAsync("ConcreteNormal", concreteNormal, scene, progressMonitor);
    const concreteMetallicRoughnessPromise = loadTextureAsync(
        "ConcreteMetallicRoughness",
        concreteMetallicRoughness,
        scene,
        progressMonitor,
    );
    const concreteAmbientOcclusionPromise = loadTextureAsync(
        "ConcreteAmbientOcclusion",
        concreteAmbientOcclusion,
        scene,
        progressMonitor,
    );

    // Crate
    const crateAlbedoPromise = loadTextureAsync("CrateAlbedo", crateAlbedo, scene, progressMonitor);
    const crateNormalPromise = loadTextureAsync("CrateNormal", crateNormal, scene, progressMonitor);
    const crateMetallicRoughnessPromise = loadTextureAsync(
        "CrateMetallicRoughness",
        crateMetallicRoughness,
        scene,
        progressMonitor,
    );
    const crateAmbientOcclusionPromise = loadTextureAsync(
        "CrateAmbientOcclusion",
        crateAmbientOcclusion,
        scene,
        progressMonitor,
    );

    // Gas giants texture
    const jupiterTexturePromise = loadTextureAsync("JupiterTexture", jupiterTexturePath, scene, progressMonitor);
    const saturnTexturePromise = loadTextureAsync("SaturnTexture", saturnTexturePath, scene, progressMonitor);
    const uranusTexturePromise = loadTextureAsync("UranusTexture", uranusTexturePath, scene, progressMonitor);
    const neptuneTexturePromise = loadTextureAsync("NeptuneTexture", neptuneTexturePath, scene, progressMonitor);

    // Rings texture
    const saturnRingsTexturePromise = loadTextureAsync("SaturnRingsTexture", saturnRingsPath, scene, progressMonitor);
    const uranusRingsTexturePromise = loadTextureAsync("UranusRingsTexture", uranusRingsPath, scene, progressMonitor);

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
        gasPlanet: {
            jupiter: await jupiterTexturePromise,
            saturn: await saturnTexturePromise,
            uranus: await uranusTexturePromise,
            neptune: await neptuneTexturePromise,
        },
        rings: {
            saturn: await saturnRingsTexturePromise,
            uranus: await uranusRingsTexturePromise,
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
