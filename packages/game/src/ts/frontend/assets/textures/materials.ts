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
import { loadConcreteTextures } from "./concrete";
import { loadTextureAsync } from "./utils";

import crateAlbedo from "@assets/crateMaterial/space-crate1-albedo.webp";
import crateAmbientOcclusion from "@assets/crateMaterial/space-crate1-ao.webp";
import crateMetallicRoughness from "@assets/crateMaterial/space-crate1-metallic-roughness.webp";
import crateNormal from "@assets/crateMaterial/space-crate1-normal-dx.webp";
import metalPanelsMetallicRoughness from "@assets/metalPanelMaterial/metallicRoughness.webp";
import metalPanelsAlbedo from "@assets/metalPanelMaterial/sci-fi-panel1-albedo.webp";
import metalPanelsAmbientOcclusion from "@assets/metalPanelMaterial/sci-fi-panel1-ao.webp";
import metalPanelsNormal from "@assets/metalPanelMaterial/sci-fi-panel1-normal-dx.webp";
import solarPanelMetallicRoughness from "@assets/SolarPanelMaterial/metallicRougness.webp";
import solarPanelAlbedo from "@assets/SolarPanelMaterial/SolarPanel002_2K-PNG_Color.webp";
import solarPanelNormal from "@assets/SolarPanelMaterial/SolarPanel002_2K-PNG_NormalDX.webp";
import spaceStationMetallicRoughness from "@assets/spaceStationMaterial/metallicRoughness.webp";
import spaceStationAlbedo from "@assets/spaceStationMaterial/spaceship-panels1-albedo.webp";
import spaceStationAmbientOcclusion from "@assets/spaceStationMaterial/spaceship-panels1-ao.webp";
import spaceStationNormal from "@assets/spaceStationMaterial/spaceship-panels1-normal-dx.webp";
import treeTexturePath from "@assets/tree/Tree.png";

export type PBRTextures = {
    albedo: Texture;
    normal: Texture;
    metallicRoughness: Texture;
    ambientOcclusion: Texture;
};

export type AllMaterialTextures = {
    solarPanel: Omit<PBRTextures, "ambientOcclusion">;
    spaceStation: PBRTextures;
    metalPanels: PBRTextures;
    concrete: PBRTextures;
    crate: PBRTextures;
    tree: Pick<PBRTextures, "albedo">;
};

export async function loadMaterialTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<AllMaterialTextures> {
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

    const concretePromise = loadConcreteTextures(scene, progressMonitor);

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

    const treeAlbedo = await treeAlbedoPromise;
    treeAlbedo.hasAlpha = true;

    return {
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
        concrete: await concretePromise,
        crate: {
            albedo: await crateAlbedoPromise,
            normal: await crateNormalPromise,
            metallicRoughness: await crateMetallicRoughnessPromise,
            ambientOcclusion: await crateAmbientOcclusionPromise,
        },
        tree: {
            albedo: treeAlbedo,
        },
    };
}
