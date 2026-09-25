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

import type { ILoadingProgressMonitor } from "../../loadingProgressMonitor";
import { loadTextureAsync } from "../utils";
import { loadConcreteTextures } from "./concrete";
import { loadCrateTextures } from "./crate";
import type { CrateTextures } from "./crate";
import { loadSolarPanelTextures } from "./solarPanel";
import type { SolarPanelTextures } from "./solarPanel";
import { loadStyroFoamTextures } from "./styrofoam";
import type { StyroFoamTextures } from "./styrofoam";
import { loadTireTextures } from "./tire";
import type { TireTextures } from "./tire";

import metalPanelsMetallicRoughness from "@assets/metalPanelMaterial/metallicRoughness.webp";
import metalPanelsAlbedo from "@assets/metalPanelMaterial/sci-fi-panel1-albedo.webp";
import metalPanelsAmbientOcclusion from "@assets/metalPanelMaterial/sci-fi-panel1-ao.webp";
import metalPanelsNormal from "@assets/metalPanelMaterial/sci-fi-panel1-normal-dx.webp";
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
    solarPanel: SolarPanelTextures;
    spaceStation: PBRTextures;
    metalPanels: PBRTextures;
    concrete: PBRTextures;
    crate: CrateTextures;
    tire: TireTextures;
    styroFoam: StyroFoamTextures;
    tree: Pick<PBRTextures, "albedo">;
};

export async function loadMaterialTextures(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<AllMaterialTextures> {
    // Space Station
    const spaceStationAlbedoPromise = loadTextureAsync(
        "SpaceStationAlbedo",
        spaceStationAlbedo,
        engine,
        progressMonitor,
    );
    const spaceStationNormalPromise = loadTextureAsync(
        "SpaceStationNormal",
        spaceStationNormal,
        engine,
        progressMonitor,
    );
    const spaceStationMetallicRoughnessPromise = loadTextureAsync(
        "SpaceStationMetallicRoughness",
        spaceStationMetallicRoughness,
        engine,
        progressMonitor,
    );
    const spaceStationAmbientOcclusionPromise = loadTextureAsync(
        "SpaceStationAmbientOcclusion",
        spaceStationAmbientOcclusion,
        engine,
        progressMonitor,
    );

    // Metal Panels
    const metalPanelsAlbedoPromise = loadTextureAsync("MetalPanelsAlbedo", metalPanelsAlbedo, engine, progressMonitor);
    const metalPanelsNormalPromise = loadTextureAsync("MetalPanelsNormal", metalPanelsNormal, engine, progressMonitor);
    const metalPanelsMetallicRoughnessPromise = loadTextureAsync(
        "MetalPanelsMetallicRoughness",
        metalPanelsMetallicRoughness,
        engine,
        progressMonitor,
    );
    const metalPanelsAmbientOcclusionPromise = loadTextureAsync(
        "MetalPanelsAmbientOcclusion",
        metalPanelsAmbientOcclusion,
        engine,
        progressMonitor,
    );

    const treeAlbedoPromise = loadTextureAsync("TreeAlbedo", treeTexturePath, engine, progressMonitor);

    const concretePromise = loadConcreteTextures(engine, progressMonitor);

    const cratePromise = loadCrateTextures(engine, progressMonitor);

    const tirePromise = loadTireTextures(engine, progressMonitor);

    const styroFoamPromise = loadStyroFoamTextures(engine, progressMonitor);

    const solarPanelPromise = loadSolarPanelTextures(engine, progressMonitor);

    const treeAlbedo = await treeAlbedoPromise;
    treeAlbedo.hasAlpha = true;

    return {
        solarPanel: await solarPanelPromise,
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
        crate: await cratePromise,
        tree: {
            albedo: treeAlbedo,
        },
        tire: await tirePromise,
        styroFoam: await styroFoamPromise,
    };
}
