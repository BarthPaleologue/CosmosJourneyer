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

import { CloudsLut } from "@/frontend/postProcesses/clouds/cloudsLut";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { TelluricPlanetMaterialLut } from "@/frontend/universe/planets/telluricPlanet/telluricPlanetMaterialLut";
import { StarMaterialLut } from "@/frontend/universe/stellarObjects/star/starMaterialLut";

import { ItemPool } from "@/utils/itemPool";

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
import earthHeightMap2x4_0_0 from "@assets/sol/textures/earthHeightMap2x4/0_0.png";
import earthHeightMap2x4_0_1 from "@assets/sol/textures/earthHeightMap2x4/0_1.png";
import earthHeightMap2x4_0_2 from "@assets/sol/textures/earthHeightMap2x4/0_2.png";
import earthHeightMap2x4_0_3 from "@assets/sol/textures/earthHeightMap2x4/0_3.png";
import earthHeightMap2x4_1_0 from "@assets/sol/textures/earthHeightMap2x4/1_0.png";
import earthHeightMap2x4_1_1 from "@assets/sol/textures/earthHeightMap2x4/1_1.png";
import earthHeightMap2x4_1_2 from "@assets/sol/textures/earthHeightMap2x4/1_2.png";
import earthHeightMap2x4_1_3 from "@assets/sol/textures/earthHeightMap2x4/1_3.png";
import earthHeightMap1x1 from "@assets/sol/textures/earthHeightMap8k.png";
import jupiterTexturePath from "@assets/sol/textures/jupiter.jpg";
import marsHeightMap1x1 from "@assets/sol/textures/marsHeightMap1x1.jpg";
import marsHeightMap_0_0 from "@assets/sol/textures/marsHeightMap2x4/0_0.jpg";
import marsHeightMap_0_1 from "@assets/sol/textures/marsHeightMap2x4/0_1.jpg";
import marsHeightMap_0_2 from "@assets/sol/textures/marsHeightMap2x4/0_2.jpg";
import marsHeightMap_0_3 from "@assets/sol/textures/marsHeightMap2x4/0_3.jpg";
import marsHeightMap_1_0 from "@assets/sol/textures/marsHeightMap2x4/1_0.jpg";
import marsHeightMap_1_1 from "@assets/sol/textures/marsHeightMap2x4/1_1.jpg";
import marsHeightMap_1_2 from "@assets/sol/textures/marsHeightMap2x4/1_2.jpg";
import marsHeightMap_1_3 from "@assets/sol/textures/marsHeightMap2x4/1_3.jpg";
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

export type TexturePools = {
    cloudsLut: ItemPool<CloudsLut>;
    ringsPatternLut: ItemPool<RingsProceduralPatternLut>;
    starMaterialLut: ItemPool<StarMaterialLut>;
    telluricPlanetMaterialLut: ItemPool<TelluricPlanetMaterialLut>;
    landingPad: LandingPadTexturePool;
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

export type HeightMap1x1 = {
    type: "1x1";
    texture: Texture;
};

export type HeightMap2x4 = {
    type: "2x4";
    textures: [[Texture, Texture, Texture, Texture], [Texture, Texture, Texture, Texture]];
};

export type HeightMap = HeightMap1x1 | HeightMap2x4;

export type HeightMaps = {
    earth1x1: Readonly<HeightMap1x1>;
    earth2x4: Readonly<HeightMap2x4>;
    mars1x1: Readonly<HeightMap1x1>;
    mars2x4: Readonly<HeightMap2x4>;
};

export type Textures = {
    readonly terrains: Readonly<AllTerrainTextures>;
    readonly water: Readonly<WaterTextures>;
    readonly particles: Readonly<ParticleTextures>;
    readonly materials: Readonly<AllMaterialTextures>;
    readonly gasPlanet: Readonly<GasPlanetTextures>;
    readonly rings: Readonly<RingsTextures>;
    readonly heightMaps: HeightMaps;
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

    // Gas giants texture
    const jupiterTexturePromise = loadTextureAsync("JupiterTexture", jupiterTexturePath);
    const saturnTexturePromise = loadTextureAsync("SaturnTexture", saturnTexturePath);
    const uranusTexturePromise = loadTextureAsync("UranusTexture", uranusTexturePath);
    const neptuneTexturePromise = loadTextureAsync("NeptuneTexture", neptuneTexturePath);

    // Rings texture
    const saturnRingsTexturePromise = loadTextureAsync("SaturnRingsTexture", saturnRingsPath);
    const uranusRingsTexturePromise = loadTextureAsync("UranusRingsTexture", uranusRingsPath);

    const marsHeightMapPromise_0_0 = loadTextureAsync("MarsHeightMap_0_0", marsHeightMap_0_0);
    const marsHeightMapPromise_0_1 = loadTextureAsync("MarsHeightMap_0_1", marsHeightMap_0_1);
    const marsHeightMapPromise_0_2 = loadTextureAsync("MarsHeightMap_0_2", marsHeightMap_0_2);
    const marsHeightMapPromise_0_3 = loadTextureAsync("MarsHeightMap_0_3", marsHeightMap_0_3);
    const marsHeightMapPromise_1_0 = loadTextureAsync("MarsHeightMap_1_0", marsHeightMap_1_0);
    const marsHeightMapPromise_1_1 = loadTextureAsync("MarsHeightMap_1_1", marsHeightMap_1_1);
    const marsHeightMapPromise_1_2 = loadTextureAsync("MarsHeightMap_1_2", marsHeightMap_1_2);
    const marsHeightMapPromise_1_3 = loadTextureAsync("MarsHeightMap_1_3", marsHeightMap_1_3);

    const marsHeightMapPromise1x1 = loadTextureAsync("MarsHeightMap1x1", marsHeightMap1x1);

    const earthHeightMapPromise_0_0 = loadTextureAsync("EarthHeightMap_0_0", earthHeightMap2x4_0_0);
    const earthHeightMapPromise_0_1 = loadTextureAsync("EarthHeightMap_0_1", earthHeightMap2x4_0_1);
    const earthHeightMapPromise_0_2 = loadTextureAsync("EarthHeightMap_0_2", earthHeightMap2x4_0_2);
    const earthHeightMapPromise_0_3 = loadTextureAsync("EarthHeightMap_0_3", earthHeightMap2x4_0_3);
    const earthHeightMapPromise_1_0 = loadTextureAsync("EarthHeightMap_1_0", earthHeightMap2x4_1_0);
    const earthHeightMapPromise_1_1 = loadTextureAsync("EarthHeightMap_1_1", earthHeightMap2x4_1_1);
    const earthHeightMapPromise_1_2 = loadTextureAsync("EarthHeightMap_1_2", earthHeightMap2x4_1_2);
    const earthHeightMapPromise_1_3 = loadTextureAsync("EarthHeightMap_1_3", earthHeightMap2x4_1_3);

    const earthHeightMapPromise1x1 = loadTextureAsync("EarthHeightMap1x1", earthHeightMap1x1);

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
        heightMaps: {
            mars1x1: {
                type: "1x1",
                texture: await marsHeightMapPromise1x1,
            },
            mars2x4: {
                type: "2x4",
                textures: [
                    [
                        await marsHeightMapPromise_0_0,
                        await marsHeightMapPromise_0_1,
                        await marsHeightMapPromise_0_2,
                        await marsHeightMapPromise_0_3,
                    ],
                    [
                        await marsHeightMapPromise_1_0,
                        await marsHeightMapPromise_1_1,
                        await marsHeightMapPromise_1_2,
                        await marsHeightMapPromise_1_3,
                    ],
                ],
            },
            earth1x1: {
                type: "1x1",
                texture: await earthHeightMapPromise1x1,
            },
            earth2x4: {
                type: "2x4",
                textures: [
                    [
                        await earthHeightMapPromise_0_0,
                        await earthHeightMapPromise_0_1,
                        await earthHeightMapPromise_0_2,
                        await earthHeightMapPromise_0_3,
                    ],
                    [
                        await earthHeightMapPromise_1_0,
                        await earthHeightMapPromise_1_1,
                        await earthHeightMapPromise_1_2,
                        await earthHeightMapPromise_1_3,
                    ],
                ],
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
        ringsPatternLut: new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene)),
        starMaterialLut: new ItemPool<StarMaterialLut>(() => new StarMaterialLut(scene)),
        telluricPlanetMaterialLut: new ItemPool<TelluricPlanetMaterialLut>(() => new TelluricPlanetMaterialLut(scene)),
        landingPad: new LandingPadTexturePool(),
    };
}
