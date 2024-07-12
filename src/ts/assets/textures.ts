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
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "@babylonjs/core/scene";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";

import rockNormalMetallicMap from "../../asset/rockMaterial/layered-planetary_normal_metallic.png";
import rockAlbedoRoughnessMap from "../../asset/rockMaterial/layered-planetary_albedo_roughness.png";
import dirtNormalMap from "../../asset/textures/dirt/Ground_Dirt_008_normal.jpg";
import bottomNormalMap from "../../asset/textures/crackednormal.jpg";
import grassNormalMetallicMap from "../../asset/grassMaterial/wispy-grass-meadow_normal_metallic.png";
import grassAlbedoRoughnessMap from "../../asset/grassMaterial/wispy-grass-meadow_albedo_roughness.png";
import snowNormalMetallicMap from "../../asset/iceMaterial/ice_field_normal_metallic.png";
import snowAlbedoRoughnessMap from "../../asset/iceMaterial/ice_field_albedo_roughness.png";
import sandNormalMetallicMap from "../../asset/sandMaterial/wavy-sand_normal_metallic.png";
import sandAlbedoRoughnessMap from "../../asset/sandMaterial/wavy-sand_albedo_roughness.png";
import waterNormal1 from "../../asset/textures/waterNormalMap3.jpg";
import waterNormal2 from "../../asset/textures/waterNormalMap4.jpg";
import plumeParticle from "../../asset/textures/plume.png";
import flareParticle from "../../asset/flare.png";
import seamlessPerlin from "../../asset/perlin.png";
import atmosphereLUT from "../../shaders/textures/atmosphereLUT.glsl";
import empty from "../../asset/oneBlackPixel.png";

import skyBox from "../../asset/skybox/milkyway.env";

import cursorImage from "../../asset/textures/hoveredCircle.png";

export class Textures {
    static ROCK_NORMAL_METALLIC_MAP: Texture;
    static ROCK_ALBEDO_ROUGHNESS_MAP: Texture;

    static DIRT_NORMAL_MAP: Texture;
    static BOTTOM_NORMAL_MAP: Texture;

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

    static EMPTY_TEXTURE: Texture;

    static CURSOR_IMAGE_URL: string;

    static ATMOSPHERE_LUT: ProceduralTexture;

    static SEAMLESS_PERLIN: Texture;

    static MILKY_WAY: CubeTexture;

    static EnqueueTasks(manager: AssetsManager, scene: Scene) {
        manager.addTextureTask("RockNormalMetallicMap", rockNormalMetallicMap).onSuccess = (task) => (Textures.ROCK_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("RockAlbedoRoughnessMap", rockAlbedoRoughnessMap).onSuccess = (task) => (Textures.ROCK_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("DirtNormalMap", dirtNormalMap).onSuccess = (task) => (Textures.DIRT_NORMAL_MAP = task.texture);
        manager.addTextureTask("BottomNormalMap", bottomNormalMap).onSuccess = (task) => (Textures.BOTTOM_NORMAL_MAP = task.texture);

        manager.addTextureTask("GrassNormalMetallicMap", grassNormalMetallicMap).onSuccess = (task) => (Textures.GRASS_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("GrassAlbedoRoughnessMap", grassAlbedoRoughnessMap).onSuccess = (task) => (Textures.GRASS_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("SnowNormalMetallicMap", snowNormalMetallicMap).onSuccess = (task) => (Textures.SNOW_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("SnowAlbedoRoughness", snowAlbedoRoughnessMap).onSuccess = (task) => (Textures.SNOW_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("SandNormalMetallicMap", sandNormalMetallicMap).onSuccess = (task) => (Textures.SAND_NORMAL_METALLIC_MAP = task.texture);
        manager.addTextureTask("SandAlbedoRoughnessMap", sandAlbedoRoughnessMap).onSuccess = (task) => (Textures.SAND_ALBEDO_ROUGHNESS_MAP = task.texture);

        manager.addTextureTask("WaterNormalMap1", waterNormal1).onSuccess = (task) => (Textures.WATER_NORMAL_MAP_1 = task.texture);
        manager.addTextureTask("WaterNormalMap2", waterNormal2).onSuccess = (task) => (Textures.WATER_NORMAL_MAP_2 = task.texture);

        manager.addTextureTask("PlumeParticle", plumeParticle).onSuccess = (task) => (Textures.PLUME_PARTICLE = task.texture);
        manager.addTextureTask("FlareTexture", flareParticle).onSuccess = (task) => (Textures.FLARE_TEXTURE = task.texture);

        manager.addTextureTask("SeamlessPerlin", seamlessPerlin).onSuccess = (task) => (Textures.SEAMLESS_PERLIN = task.texture);

        manager.addCubeTextureTask("SkyBox", skyBox).onSuccess = (task) => (Textures.MILKY_WAY = task.texture);

        Textures.ATMOSPHERE_LUT = new ProceduralTexture("atmosphereLUT", 100, { fragmentSource: atmosphereLUT }, scene, undefined, false, false);
        Textures.ATMOSPHERE_LUT.refreshRate = 0;

        this.CURSOR_IMAGE_URL = cursorImage;

        manager.addTextureTask("EmptyTexture", empty).onSuccess = (task) => (Textures.EMPTY_TEXTURE = task.texture);
    }
}
