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

import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Helpers/sceneHelpers";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";

import rockNormalMetallicMap from "../../asset/rockMaterial/layered-planetary_normal_metallic.webp";
import rockAlbedoRoughnessMap from "../../asset/rockMaterial/layered-planetary_albedo_roughness.webp";

import grassNormalMetallicMap from "../../asset/grassMaterial/wispy-grass-meadow_normal_metallic.webp";
import grassAlbedoRoughnessMap from "../../asset/grassMaterial/wispy-grass-meadow_albedo_roughness.webp";

import snowNormalMetallicMap from "../../asset/iceMaterial/ice_field_normal_metallic.webp";
import snowAlbedoRoughnessMap from "../../asset/iceMaterial/ice_field_albedo_roughness.webp";

import sandNormalMetallicMap from "../../asset/sandMaterial/wavy-sand_normal_metallic.webp";
import sandAlbedoRoughnessMap from "../../asset/sandMaterial/wavy-sand_albedo_roughness.webp";

import waterNormal1 from "../../asset/textures/waterNormalMap3.jpg";
import waterNormal2 from "../../asset/textures/waterNormalMap4.jpg";
import plumeParticle from "../../asset/textures/plume.png";
import flareParticle from "../../asset/flare.png";
import seamlessPerlin from "../../asset/perlin.webp";
import empty from "../../asset/oneBlackPixel.webp";

import skyBox from "../../asset/skybox/milkyway.env";

import cursorImage from "../../asset/textures/hoveredCircle.png";

import butterflyTexture from "../../asset/butterfly.webp";

import solarPanelAlbedo from "../../asset/SolarPanelMaterial/SolarPanel002_2K-PNG_Color.webp";
import solarPanelNormal from "../../asset/SolarPanelMaterial/SolarPanel002_2K-PNG_NormalDX.webp";
import solarPanelMetallicRoughness from "../../asset/SolarPanelMaterial/metallicRougness.webp";

import spaceStationAlbedo from "../../asset/spaceStationMaterial/spaceship-panels1-albedo.webp";
import spaceStationNormal from "../../asset/spaceStationMaterial/spaceship-panels1-normal-dx.webp";
import spaceStationMetallicRoughness from "../../asset/spaceStationMaterial/metallicRoughness.webp";
import spaceStationMetallic from "../../asset/spaceStationMaterial/spaceship-panels1-metallic.webp";
import spaceStationRoughness from "../../asset/spaceStationMaterial/spaceship-panels1-roughness.webp";
import spaceStationAmbientOcclusion from "../../asset/spaceStationMaterial/spaceship-panels1-ao.webp";

import metalPanelsAlbdeo from "../../asset/metalPanelMaterial/sci-fi-panel1-albedo.webp";
import metalPanelsNormal from "../../asset/metalPanelMaterial/sci-fi-panel1-normal-dx.webp";
import metalPanelsMetallicRoughness from "../../asset/metalPanelMaterial/metallicRoughness.webp";
import metalPanelsRoughness from "../../asset/metalPanelMaterial/sci-fi-panel1-roughness.webp";
import metalPanelsMetallic from "../../asset/metalPanelMaterial/sci-fi-panel1-metallic.webp";
import metalPanelsAmbientOcclusion from "../../asset/metalPanelMaterial/sci-fi-panel1-ao.webp";

import crateAlbedo from "../../asset/crateMaterial/space-crate1-albedo.webp";
import crateNormal from "../../asset/crateMaterial/space-crate1-normal-dx.webp";
import crateMetallicRoughness from "../../asset/crateMaterial/space-crate1-metallic-roughness.webp";
import crateAmbientOcclusion from "../../asset/crateMaterial/space-crate1-ao.webp";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Settings } from "../settings";

export class Textures {
    static ROCK_NORMAL_METALLIC_MAP: Texture;
    static ROCK_ALBEDO_ROUGHNESS_MAP: Texture;

    static GRASS_NORMAL_METALLIC_MAP: Texture;
    static GRASS_ALBEDO_ROUGHNESS_MAP: Texture;

    static SNOW_NORMAL_METALLIC_MAP: Texture;
    static SNOW_ALBEDO_ROUGHNESS_MAP: Texture;

    static SAND_NORMAL_METALLIC_MAP: Texture;
    static SAND_ALBEDO_ROUGHNESS_MAP: Texture;

    static WATER_NORMAL_MAP_1: Texture;
    static WATER_NORMAL_MAP_2: Texture;

    static PLUME_PARTICLE: Texture;

    static FLARE_TEXTURE: Texture;

    static BUTTERFLY: Texture;

    static EMPTY_TEXTURE: Texture;

    static CURSOR_IMAGE_URL: string;

    static SEAMLESS_PERLIN: Texture;

    static SOLAR_PANEL_ALBEDO: Texture;
    static SOLAR_PANEL_NORMAL: Texture;
    static SOLAR_PANEL_METALLIC_ROUGHNESS: Texture;

    static SPACE_STATION_ALBEDO: Texture;
    static SPACE_STATION_NORMAL: Texture;
    static SPACE_STATION_METALLIC_ROUGHNESS: Texture;
    static SPACE_STATION_METALLIC: Texture;
    static SPACE_STATION_ROUGHNESS: Texture;
    static SPACE_STATION_AMBIENT_OCCLUSION: Texture;

    static METAL_PANELS_ALBEDO: Texture;
    static METAL_PANELS_NORMAL: Texture;
    static METAL_PANELS_METALLIC_ROUGHNESS: Texture;
    static METAL_PANELS_METALLIC: Texture;
    static METAL_PANELS_ROUGHNESS: Texture;
    static METAL_PANELS_AMBIENT_OCCLUSION: Texture;

    static CRATE_ALBEDO: Texture;
    static CRATE_NORMAL: Texture;
    static CRATE_METALLIC_ROUGHNESS: Texture;
    static CRATE_AMBIENT_OCCLUSION: Texture;

    static MILKY_WAY: CubeTexture;

    private static LANDING_PAD_NUMBER_TEXTURES: Map<number, DynamicTexture> = new Map();

    static EnqueueTasks(manager: AssetsManager, scene: Scene) {
        manager.addTextureTask("RockNormalMetallicMap", rockNormalMetallicMap).onSuccess = (task) =>
            (Textures.ROCK_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("RockAlbedoRoughnessMap", rockAlbedoRoughnessMap).onSuccess = (task) =>
            (Textures.ROCK_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("GrassNormalMetallicMap", grassNormalMetallicMap).onSuccess = (task) =>
            (Textures.GRASS_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("GrassAlbedoRoughnessMap", grassAlbedoRoughnessMap).onSuccess = (task) =>
            (Textures.GRASS_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("SnowNormalMetallicMap", snowNormalMetallicMap).onSuccess = (task) =>
            (Textures.SNOW_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("SnowAlbedoRoughness", snowAlbedoRoughnessMap).onSuccess = (task) =>
            (Textures.SNOW_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("SandNormalMetallicMap", sandNormalMetallicMap).onSuccess = (task) =>
            (Textures.SAND_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("SandAlbedoRoughnessMap", sandAlbedoRoughnessMap).onSuccess = (task) =>
            (Textures.SAND_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("WaterNormalMap1", waterNormal1).onSuccess = (task) =>
            (Textures.WATER_NORMAL_MAP_1 = task.texture);
        manager.addTextureTask("WaterNormalMap2", waterNormal2).onSuccess = (task) =>
            (Textures.WATER_NORMAL_MAP_2 = task.texture);

        manager.addTextureTask("PlumeParticle", plumeParticle).onSuccess = (task) =>
            (Textures.PLUME_PARTICLE = task.texture);
        manager.addTextureTask("FlareTexture", flareParticle).onSuccess = (task) =>
            (Textures.FLARE_TEXTURE = task.texture);

        manager.addTextureTask("Butterfly", butterflyTexture).onSuccess = (task) => (Textures.BUTTERFLY = task.texture);

        manager.addTextureTask("SeamlessPerlin", seamlessPerlin).onSuccess = (task) =>
            (Textures.SEAMLESS_PERLIN = task.texture);

        manager.addTextureTask("SolarPanelAlbedo", solarPanelAlbedo).onSuccess = (task) =>
            (Textures.SOLAR_PANEL_ALBEDO = task.texture);
        manager.addTextureTask("SolarPanelNormal", solarPanelNormal).onSuccess = (task) =>
            (Textures.SOLAR_PANEL_NORMAL = task.texture);
        manager.addTextureTask("SolarPanelMetallicRoughness", solarPanelMetallicRoughness).onSuccess = (task) =>
            (Textures.SOLAR_PANEL_METALLIC_ROUGHNESS = task.texture);

        manager.addTextureTask("SpaceStationAlbedo", spaceStationAlbedo).onSuccess = (task) =>
            (Textures.SPACE_STATION_ALBEDO = task.texture);
        manager.addTextureTask("SpaceStationNormal", spaceStationNormal).onSuccess = (task) =>
            (Textures.SPACE_STATION_NORMAL = task.texture);
        manager.addTextureTask("SpaceStationMetallicRoughness", spaceStationMetallicRoughness).onSuccess = (task) =>
            (Textures.SPACE_STATION_METALLIC_ROUGHNESS = task.texture);
        manager.addTextureTask("SpaceStationMetallic", spaceStationMetallic).onSuccess = (task) =>
            (Textures.SPACE_STATION_METALLIC = task.texture);
        manager.addTextureTask("SpaceStationRoughness", spaceStationRoughness).onSuccess = (task) =>
            (Textures.SPACE_STATION_ROUGHNESS = task.texture);
        manager.addTextureTask("SpaceStationAmbientOcclusion", spaceStationAmbientOcclusion).onSuccess = (task) =>
            (Textures.SPACE_STATION_AMBIENT_OCCLUSION = task.texture);

        manager.addTextureTask("MetalPanelsAlbedo", metalPanelsAlbdeo).onSuccess = (task) =>
            (Textures.METAL_PANELS_ALBEDO = task.texture);
        manager.addTextureTask("MetalPanelsNormal", metalPanelsNormal).onSuccess = (task) =>
            (Textures.METAL_PANELS_NORMAL = task.texture);
        manager.addTextureTask("MetalPanelsMetallicRoughness", metalPanelsMetallicRoughness).onSuccess = (task) =>
            (Textures.METAL_PANELS_METALLIC_ROUGHNESS = task.texture);
        manager.addTextureTask("MetalPanelsMetallic", metalPanelsMetallic).onSuccess = (task) =>
            (Textures.METAL_PANELS_METALLIC = task.texture);
        manager.addTextureTask("MetalPanelsRoughness", metalPanelsRoughness).onSuccess = (task) =>
            (Textures.METAL_PANELS_ROUGHNESS = task.texture);
        manager.addTextureTask("MetalPanelsAmbientOcclusion", metalPanelsAmbientOcclusion).onSuccess = (task) =>
            (Textures.METAL_PANELS_AMBIENT_OCCLUSION = task.texture);

        manager.addTextureTask("CrateAlbedo", crateAlbedo).onSuccess = (task) => (Textures.CRATE_ALBEDO = task.texture);
        manager.addTextureTask("CrateNormal", crateNormal).onSuccess = (task) => (Textures.CRATE_NORMAL = task.texture);
        manager.addTextureTask("CrateMetallicRoughness", crateMetallicRoughness).onSuccess = (task) =>
            (Textures.CRATE_METALLIC_ROUGHNESS = task.texture);
        manager.addTextureTask("CrateAmbientOcclusion", crateAmbientOcclusion).onSuccess = (task) =>
            (Textures.CRATE_AMBIENT_OCCLUSION = task.texture);

        manager.addCubeTextureTask("SkyBox", skyBox).onSuccess = (task) => (Textures.MILKY_WAY = task.texture);

        this.CURSOR_IMAGE_URL = cursorImage;

        manager.addTextureTask("EmptyTexture", empty).onSuccess = (task) => (Textures.EMPTY_TEXTURE = task.texture);
    }

    static GetLandingPadNumberTexture(padNumber: number, scene: Scene): DynamicTexture {
        const texture = Textures.LANDING_PAD_NUMBER_TEXTURES.get(padNumber);
        if (texture !== undefined) {
            return texture;
        }

        const padNumberTextureResolution = 1024;
        const numberTexture = new DynamicTexture(
            `PadNumberTexture${padNumber}`,
            {
                width: padNumberTextureResolution,
                height: padNumberTextureResolution * Settings.LANDING_PAD_ASPECT_RATIO
            },
            scene,
            true
        );

        //Add text to dynamic texture
        const font = `bold 256px ${Settings.MAIN_FONT}`;
        numberTexture.drawText(`${padNumber}`, null, null, font, "white", null, true, true);

        Textures.LANDING_PAD_NUMBER_TEXTURES.set(padNumber, numberTexture);

        return numberTexture;
    }
}
