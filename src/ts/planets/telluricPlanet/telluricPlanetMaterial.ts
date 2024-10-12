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

import { ColorMode } from "./colorSettingsInterface";

import surfaceMaterialFragment from "../../../shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../../shaders/telluricPlanetMaterial/vertex.glsl";
import { Assets } from "../../assets/assets";
import { centeredRand } from "extended-random";
import { TelluricPlanetModel } from "./telluricPlanetModel";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import lutFragment from "../../../shaders/telluricPlanetMaterial/utils/lut.glsl";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Transformable } from "../../architecture/transformable";
import { Scene } from "@babylonjs/core/scene";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../../postProcesses/uniforms/stellarObjectUniforms";
import { Textures } from "../../assets/textures";
import { Matrix } from "@babylonjs/core/Maths/math";

import { getRngFromSeed } from "../../utils/getRngFromSeed";

const TelluricPlanetMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    COLOR_MODE: "colorMode",
    PLANET_RADIUS: "planetRadius",
    CHUNK_POSITION_PLANET_SPACE: "chunkPositionPlanetSpace",
    CAMERA_POSITION: "cameraPosition",
    PLANET_WORLD_MATRIX: "planetWorldMatrix",
    WATER_LEVEL: "waterLevel",
    BEACH_SIZE: "beachSize",
    STEEP_SHARPNESS: "steepSharpness",
    MAX_ELEVATION: "maxElevation",
    MIN_TEMPERATURE: "minTemperature",
    MAX_TEMPERATURE: "maxTemperature",
    PRESSURE: "pressure",
    WATER_AMOUNT: "waterAmount"
};

const TelluricPlanetMaterialSamplerNames = {
    LUT: "lut",
    PLAIN_NORMAL_METALLIC_MAP: "plainNormalMetallicMap",
    PLAIN_ALBEDO_ROUGHNESS_MAP: "plainAlbedoRoughnessMap",
    DESERT_NORMAL_METALLIC_MAP: "desertNormalMetallicMap",
    DESERT_ALBEDO_ROUGHNESS_MAP: "desertAlbedoRoughnessMap",
    SNOW_NORMAL_METALLIC_MAP: "snowNormalMetallicMap",
    SNOW_ALBEDO_ROUGHNESS_MAP: "snowAlbedoRoughnessMap",
    STEEP_NORMAL_METALLIC_MAP: "steepNormalMetallicMap",
    STEEP_ALBEDO_ROUGHNESS_MAP: "steepAlbedoRoughnessMap"
};

/**
 * The material for telluric planets.
 * It is responsible for the shading of the surface of the planet (biome blending, normal mapping and color)
 */
export class TelluricPlanetMaterial extends ShaderMaterial {
    /**
     * The model of the planet associated with this material
     */
    private readonly planetModel: TelluricPlanetModel;

    private readonly plainNormalMetallicMap: Texture;
    private readonly plainAlbedoRoughnessMap: Texture;

    private readonly desertNormalMetallicMap: Texture;
    private readonly desertAlbedoRoughnessMap: Texture;

    private readonly snowNormalMetallic: Texture;
    private readonly snowAlbedoRoughnessMap: Texture;

    private readonly steepNormalMetallic: Texture;
    private readonly steepAlbedoRoughnessMap: Texture;

    private colorMode: ColorMode;
    private beachSize: number;
    private steepSharpness: number;

    /**
     * Creates a new telluric planet material
     * @param planetName The name of the planet
     * @param model The model of the planet associated with this material
     * @param scene
     */
    constructor(planetName: string, model: TelluricPlanetModel, scene: Scene) {
        const shaderName = "surfaceMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;
        }

        super(`${planetName}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [...Object.values(TelluricPlanetMaterialUniformNames), ...Object.values(StellarObjectUniformNames)],
            samplers: [...Object.values(TelluricPlanetMaterialSamplerNames)]
        });

        const rng = getRngFromSeed(model.seed);

        this.planetModel = model;

        this.beachSize = 100 + 50 * centeredRand(rng, 85);
        this.colorMode = ColorMode.DEFAULT;
        this.steepSharpness = 2;

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.plainNormalMetallicMap = Textures.GRASS_NORMAL_METALLIC_MAP;
        this.plainAlbedoRoughnessMap = Textures.GRASS_ALBEDO_ROUGHNESS_MAP;

        this.desertNormalMetallicMap = Textures.SAND_NORMAL_METALLIC_MAP;
        this.desertAlbedoRoughnessMap = Textures.SAND_ALBEDO_ROUGHNESS_MAP;

        this.snowNormalMetallic = Textures.SNOW_NORMAL_METALLIC_MAP;
        this.snowAlbedoRoughnessMap = Textures.SNOW_ALBEDO_ROUGHNESS_MAP;

        this.steepNormalMetallic = Textures.ROCK_NORMAL_METALLIC_MAP;
        this.steepAlbedoRoughnessMap = Textures.ROCK_ALBEDO_ROUGHNESS_MAP;

        if (model.physicalProperties.oceanLevel === 0) {
            if (model.physicalProperties.pressure > 0) {
                // desert world
                this.plainNormalMetallicMap = Textures.SAND_NORMAL_METALLIC_MAP;
                this.plainAlbedoRoughnessMap = Textures.SAND_ALBEDO_ROUGHNESS_MAP;
            } else {
                // sterile world
                this.plainNormalMetallicMap = Textures.ROCK_NORMAL_METALLIC_MAP;
                this.plainAlbedoRoughnessMap = Textures.ROCK_ALBEDO_ROUGHNESS_MAP;
            }
        }

        if (Effect.ShadersStore["telluricPlanetLutFragmentShader"] === undefined) {
            Effect.ShadersStore["telluricPlanetLutFragmentShader"] = lutFragment;
        }

        this.setTexture("lut", Textures.EMPTY_TEXTURE);
        const lut = new ProceduralTexture(`${planetName}MaterialLut`, 4096, "telluricPlanetLut", scene, null, true, false);
        lut.setFloat(TelluricPlanetMaterialUniformNames.MIN_TEMPERATURE, this.planetModel.physicalProperties.minTemperature);
        lut.setFloat(TelluricPlanetMaterialUniformNames.MAX_TEMPERATURE, this.planetModel.physicalProperties.maxTemperature);
        lut.setFloat(TelluricPlanetMaterialUniformNames.PRESSURE, this.planetModel.physicalProperties.pressure);
        lut.refreshRate = 0;
        lut.executeWhenReady(() => {
            this.setTexture(TelluricPlanetMaterialSamplerNames.LUT, lut);
        });

        this.onDisposeObservable.addOnce(() => {
            lut.dispose();
        });

        this.updateTextures();

        this.updateConstants();

        this.onBindObservable.add((mesh) => {
            const activeCamera = mesh.getScene().activeCamera;
            if (activeCamera === null) throw new Error("No active camera in the scene");
            this.getEffect().setVector3(TelluricPlanetMaterialUniformNames.CAMERA_POSITION, activeCamera.globalPosition);
            this.getEffect().setVector3(TelluricPlanetMaterialUniformNames.CHUNK_POSITION_PLANET_SPACE, mesh.position);
        });
    }

    public updateTextures() {
        this.setTexture(TelluricPlanetMaterialSamplerNames.STEEP_NORMAL_METALLIC_MAP, this.steepNormalMetallic);
        this.setTexture(TelluricPlanetMaterialSamplerNames.STEEP_ALBEDO_ROUGHNESS_MAP, this.steepAlbedoRoughnessMap);

        this.setTexture(TelluricPlanetMaterialSamplerNames.PLAIN_NORMAL_METALLIC_MAP, this.plainNormalMetallicMap);
        this.setTexture(TelluricPlanetMaterialSamplerNames.PLAIN_ALBEDO_ROUGHNESS_MAP, this.plainAlbedoRoughnessMap);

        this.setTexture(TelluricPlanetMaterialSamplerNames.SNOW_NORMAL_METALLIC_MAP, this.snowNormalMetallic);
        this.setTexture(TelluricPlanetMaterialSamplerNames.SNOW_ALBEDO_ROUGHNESS_MAP, this.snowAlbedoRoughnessMap);

        this.setTexture(TelluricPlanetMaterialSamplerNames.DESERT_NORMAL_METALLIC_MAP, this.desertNormalMetallicMap);
        this.setTexture(TelluricPlanetMaterialSamplerNames.DESERT_ALBEDO_ROUGHNESS_MAP, this.desertAlbedoRoughnessMap);
    }

    public updateConstants(): void {
        this.setFloat(TelluricPlanetMaterialUniformNames.PLANET_RADIUS, this.planetModel.radius);

        this.setInt(TelluricPlanetMaterialUniformNames.COLOR_MODE, this.colorMode);

        this.setFloat(TelluricPlanetMaterialUniformNames.WATER_LEVEL, this.planetModel.physicalProperties.oceanLevel);
        this.setFloat(TelluricPlanetMaterialUniformNames.BEACH_SIZE, this.beachSize);
        this.setFloat(TelluricPlanetMaterialUniformNames.STEEP_SHARPNESS, this.steepSharpness);

        this.setFloat(TelluricPlanetMaterialUniformNames.MIN_TEMPERATURE, this.planetModel.physicalProperties.minTemperature);
        this.setFloat(TelluricPlanetMaterialUniformNames.MAX_TEMPERATURE, this.planetModel.physicalProperties.maxTemperature);
        this.setFloat(TelluricPlanetMaterialUniformNames.PRESSURE, this.planetModel.physicalProperties.pressure);
        this.setFloat(TelluricPlanetMaterialUniformNames.WATER_AMOUNT, this.planetModel.physicalProperties.waterAmount);

        this.setFloat(
            TelluricPlanetMaterialUniformNames.MAX_ELEVATION,
            this.planetModel.terrainSettings.continent_base_height + this.planetModel.terrainSettings.max_mountain_height + this.planetModel.terrainSettings.max_bump_height
        );
    }

    public update(planetWorldMatrix: Matrix, stellarObjects: Transformable[]) {
        // The add once is important because the material will be bound for every chunk of the planet
        this.onBindObservable.addOnce(() => {
            this.getEffect().setMatrix(TelluricPlanetMaterialUniformNames.PLANET_WORLD_MATRIX, planetWorldMatrix);
            setStellarObjectUniforms(this.getEffect(), stellarObjects);
        });
    }

    public setBeachSize(beachSize: number) {
        this.beachSize = beachSize;
        this.updateConstants();
    }

    public getBeachSize(): number {
        return this.beachSize;
    }

    public setColorMode(colorMode: ColorMode) {
        this.colorMode = colorMode;
        this.updateConstants();
    }

    public getColorMode(): ColorMode {
        return this.colorMode;
    }

    public setSteepSharpness(steepSharpness: number) {
        this.steepSharpness = steepSharpness;
        this.updateConstants();
    }

    public getSteepSharpness(): number {
        return this.steepSharpness;
    }
}
