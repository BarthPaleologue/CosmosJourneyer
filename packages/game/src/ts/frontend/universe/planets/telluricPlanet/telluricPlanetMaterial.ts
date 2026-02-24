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

import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Matrix } from "@babylonjs/core/Maths/math";
import { type Scene } from "@babylonjs/core/scene";
import { centeredRand } from "extended-random";

import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";
import { type TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";

import { createEmptyTexture } from "@/frontend/assets/procedural/proceduralTexture";
import { type AllTerrainTextures } from "@/frontend/assets/textures/terrains";
import { OffsetWorldToRef } from "@/frontend/helpers/floatingOrigin";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames,
} from "@/frontend/postProcesses/uniforms/stellarObjectUniforms";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { type ItemPool } from "@/utils/itemPool";
import { type DeepReadonly } from "@/utils/types";

import { getColorModeIndex, type ColorMode } from "./colorSettingsInterface";
import { type TelluricPlanetMaterialLut } from "./telluricPlanetMaterialLut";

import surfaceMaterialFragment from "@shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "@shaders/telluricPlanetMaterial/vertex.glsl";

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
    WATER_AMOUNT: "waterAmount",
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
    STEEP_ALBEDO_ROUGHNESS_MAP: "steepAlbedoRoughnessMap",
};

/**
 * The material for telluric planets.
 * It is responsible for the shading of the surface of the planet (biome blending, normal mapping and color)
 */
export class TelluricPlanetMaterial extends ShaderMaterial {
    /**
     * The model of the planet associated with this material
     */
    private readonly planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;

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
     * @param model The model of the planet associated with this material
     * @param scene
     */
    constructor(
        model: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        textures: AllTerrainTextures,
        texturePool: ItemPool<TelluricPlanetMaterialLut>,
        scene: Scene,
    ) {
        const shaderName = "surfaceMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;
        }

        super(`${model.name}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [
                ...Object.values(TelluricPlanetMaterialUniformNames),
                ...Object.values(StellarObjectUniformNames),
            ],
            samplers: [...Object.values(TelluricPlanetMaterialSamplerNames)],
        });

        const rng = getRngFromSeed(model.seed);

        this.planetModel = model;

        this.beachSize = 100 + 50 * centeredRand(rng, 85);
        this.colorMode = "default";
        this.steepSharpness = 2;

        this.plainNormalMetallicMap = textures.grass.normalMetallic;
        this.plainAlbedoRoughnessMap = textures.grass.albedoRoughness;

        this.desertNormalMetallicMap = textures.sand.normalMetallic;
        this.desertAlbedoRoughnessMap = textures.sand.albedoRoughness;

        this.snowNormalMetallic = textures.snow.normalMetallic;
        this.snowAlbedoRoughnessMap = textures.snow.albedoRoughness;

        this.steepNormalMetallic = textures.rock.normalMetallic;
        this.steepAlbedoRoughnessMap = textures.rock.albedoRoughness;

        if (model.ocean === null) {
            if (model.atmosphere !== null) {
                // desert world
                this.plainNormalMetallicMap = textures.sand.normalMetallic;
                this.plainAlbedoRoughnessMap = textures.sand.albedoRoughness;
            } else {
                // sterile world
                this.plainNormalMetallicMap = textures.rock.normalMetallic;
                this.plainAlbedoRoughnessMap = textures.rock.albedoRoughness;
            }
        }

        const emptyTexture = createEmptyTexture(scene);

        this.setTexture("lut", emptyTexture);
        const lut = texturePool.get();
        lut.setPlanetPhysicsInfo(
            this.planetModel.temperature.min,
            this.planetModel.temperature.max,
            this.planetModel.atmosphere?.pressure ?? 0,
        );
        lut.getTexture().executeWhenReady(() => {
            this.setTexture(TelluricPlanetMaterialSamplerNames.LUT, lut.getTexture());
            emptyTexture.dispose();
        });

        this.onDisposeObservable.addOnce(() => {
            texturePool.release(lut);
            emptyTexture.dispose();
        });

        this.updateTextures();

        this.updateConstants();

        this.onBindObservable.add((mesh) => {
            const activeCamera = mesh.getScene().activeCamera;
            if (activeCamera === null) throw new Error("No active camera in the scene");
            this.getEffect().setVector3(
                TelluricPlanetMaterialUniformNames.CAMERA_POSITION,
                activeCamera.globalPosition,
            );
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

        this.setInt(TelluricPlanetMaterialUniformNames.COLOR_MODE, getColorModeIndex(this.colorMode));

        this.setFloat(TelluricPlanetMaterialUniformNames.WATER_LEVEL, this.planetModel.ocean?.depth ?? 0);
        this.setFloat(TelluricPlanetMaterialUniformNames.BEACH_SIZE, this.beachSize);
        this.setFloat(TelluricPlanetMaterialUniformNames.STEEP_SHARPNESS, this.steepSharpness);

        this.setFloat(TelluricPlanetMaterialUniformNames.MIN_TEMPERATURE, this.planetModel.temperature.min);
        this.setFloat(TelluricPlanetMaterialUniformNames.MAX_TEMPERATURE, this.planetModel.temperature.max);
        this.setFloat(TelluricPlanetMaterialUniformNames.PRESSURE, this.planetModel.atmosphere?.pressure ?? 0);
        this.setFloat(TelluricPlanetMaterialUniformNames.WATER_AMOUNT, this.planetModel.waterAmount);

        this.setFloat(
            TelluricPlanetMaterialUniformNames.MAX_ELEVATION,
            this.planetModel.terrainSettings.continent_base_height +
                this.planetModel.terrainSettings.max_mountain_height +
                this.planetModel.terrainSettings.max_bump_height,
        );
    }

    private readonly tempPlanetOffsetWorld = new Matrix();
    public update(planetWorldMatrix: Matrix, stellarObjects: ReadonlyArray<PointLight>) {
        // The add once is important because the material will be bound for every chunk of the planet
        this.onBindObservable.addOnce(() => {
            const floatingOriginOffset = this.getScene().floatingOriginOffset;
            this.getEffect().setMatrix(
                TelluricPlanetMaterialUniformNames.PLANET_WORLD_MATRIX,
                OffsetWorldToRef(floatingOriginOffset, planetWorldMatrix, this.tempPlanetOffsetWorld),
            );
            setStellarObjectUniforms(this.getEffect(), stellarObjects, floatingOriginOffset);
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
