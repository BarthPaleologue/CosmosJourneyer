//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { ColorMode, ColorSettings } from "./colorSettingsInterface";

import surfaceMaterialFragment from "../../../shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../../shaders/telluricPlanetMaterial/vertex.glsl";
import { Assets } from "../../assets";
import { centeredRand, normalRandom } from "extended-random";
import { TelluricPlanetModel } from "./telluricPlanetModel";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Star } from "../../stellarObjects/star/star";
import { flattenColor3Array, flattenVector3Array } from "../../utils/algebra";

import lutFragment from "../../../shaders/telluricPlanetMaterial/utils/lut.glsl";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Transformable } from "../../architecture/transformable";
import { Scene } from "@babylonjs/core/scene";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

/**
 * The material for telluric planets.
 * It is responsible for the shading of the surface of the planet (biome blending, normal mapping and color)
 */
export class TelluricPlanetMaterial extends ShaderMaterial {
    /**
     * The transform node of the planet associated with this material
     */
    private readonly planetTransform: TransformNode;

    readonly colorSettings: ColorSettings;

    /**
     * The model of the planet associated with this material
     */
    private readonly planetModel: TelluricPlanetModel;

    private stellarObjects: Transformable[] = [];

    private plainNormalMetallicMap: Texture;
    private plainAlbedoRoughnessMap: Texture;

    private desertNormalMetallicMap: Texture;
    private desertAlbedoRoughnessMap: Texture;

    private snowNormalMetallic: Texture;
    private snowAlbedoRoughnessMap: Texture;

    private steepNormalMetallic: Texture;
    private steepAlbedoRoughnessMap: Texture;

    /**
     * Creates a new telluric planet material
     * @param planetName The name of the planet
     * @param planet The transform node of the planet
     * @param model The model of the planet associated with this material
     * @param scene
     */
    constructor(planetName: string, planet: TransformNode, model: TelluricPlanetModel, scene: Scene) {
        const shaderName = "surfaceMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;
        }

        super(`${planetName}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [
                "world",
                "worldViewProjection",
                "projection",
                "view",

                "colorMode",

                "seed",

                "cameraNear",
                "cameraFar",
                "planetPosition",
                "planetRadius",

                "star_positions",
                "star_colors",
                "nbStars",

                "chunkPositionPlanetSpace",

                "cameraPosition",

                "planetWorldMatrix",

                "waterLevel",
                "beachSize",
                "steepSharpness",

                "maxElevation",

                "minTemperature",
                "maxTemperature",
                "pressure",

                "waterAmount"
            ],
            samplers: ["lut", "bottomNormalMap",

                "plainAlbedoRoughnessMap",
                "plainNormalMetallicMap",

                "desertNormalMetallicMap",
                "desertAlbedoRoughnessMap",

                "snowNormalMetallicMap",
                "snowAlbedoRoughnessMap",

                "steepNormalMetallicMap",
                "steepAlbedoRoughnessMap",
            ]
        });

        this.planetModel = model;
        this.planetTransform = planet;

        this.colorSettings = {
            mode: ColorMode.DEFAULT,

            beachSize: 100 + 50 * centeredRand(model.rng, 85),
            steepSharpness: 2,
            normalSharpness: 2.5
        };

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.plainNormalMetallicMap = Assets.GRASS_NORMAL_METALLIC_MAP;
        this.plainAlbedoRoughnessMap = Assets.GRASS_ALBEDO_ROUGHNESS_MAP;

        this.desertNormalMetallicMap = Assets.SAND_NORMAL_METALLIC_MAP;
        this.desertAlbedoRoughnessMap = Assets.SAND_ALBEDO_ROUGHNESS_MAP;

        this.snowNormalMetallic = Assets.SNOW_NORMAL_METALLIC_MAP;
        this.snowAlbedoRoughnessMap = Assets.SNOW_ALBEDO_ROUGHNESS_MAP;

        this.steepNormalMetallic = Assets.ROCK_NORMAL_METALLIC_MAP;
        this.steepAlbedoRoughnessMap = Assets.ROCK_ALBEDO_ROUGHNESS_MAP;

        if (model.physicalProperties.oceanLevel === 0) {
            if(model.physicalProperties.pressure > 0) {
                // desert world
                this.plainNormalMetallicMap = Assets.SAND_NORMAL_METALLIC_MAP;
                this.plainAlbedoRoughnessMap = Assets.SAND_ALBEDO_ROUGHNESS_MAP;
            } else {
                // sterile world
                this.plainNormalMetallicMap = Assets.ROCK_NORMAL_METALLIC_MAP;
                this.plainAlbedoRoughnessMap = Assets.ROCK_ALBEDO_ROUGHNESS_MAP;
            }
        }

        this.setFloat("seed", model.seed);

        this.setVector3("planetPosition", this.planetTransform.getAbsolutePosition());

        if (Effect.ShadersStore["telluricPlanetLutFragmentShader"] === undefined) {
            Effect.ShadersStore["telluricPlanetLutFragmentShader"] = lutFragment;
        }

        this.setTexture("lut", Assets.EMPTY_TEXTURE);
        const lut = new ProceduralTexture("lut", 4096, "telluricPlanetLut", scene, null, true, false);
        lut.setFloat("minTemperature", this.planetModel.physicalProperties.minTemperature);
        lut.setFloat("maxTemperature", this.planetModel.physicalProperties.maxTemperature);
        lut.setFloat("pressure", this.planetModel.physicalProperties.pressure);
        lut.refreshRate = 0;
        lut.executeWhenReady(() => {
            this.setTexture("lut", lut);
        });

        this.updateTextures();

        this.updateConstants();

        this.onBindObservable.add((mesh) => {
            const activeCamera = mesh.getScene().activeCamera;
            if(activeCamera === null) throw new Error("No active camera in the scene");
            this.getEffect().setVector3("cameraPosition", activeCamera.globalPosition);
            this.getEffect().setVector3("chunkPositionPlanetSpace",  mesh.position);
        });
    }

    public updateTextures() {
        this.setTexture("bottomNormalMap", Assets.BOTTOM_NORMAL_MAP);

        this.setTexture("steepNormalMetallicMap", this.steepNormalMetallic);
        this.setTexture("steepAlbedoRoughnessMap", this.steepAlbedoRoughnessMap);

        this.setTexture("plainNormalMetallicMap", this.plainNormalMetallicMap);
        this.setTexture("plainAlbedoRoughnessMap", this.plainAlbedoRoughnessMap);

        this.setTexture("snowNormalMetallicMap", this.snowNormalMetallic);
        this.setTexture("snowAlbedoRoughnessMap", this.snowAlbedoRoughnessMap);

        this.setTexture("desertNormalMetallicMap", this.desertNormalMetallicMap);
        this.setTexture("desertAlbedoRoughnessMap", this.desertAlbedoRoughnessMap);
    }

    public updateConstants(): void {
        this.setFloat("planetRadius", this.planetModel.radius);

        this.setInt("colorMode", this.colorSettings.mode);

        this.setFloat("waterLevel", this.planetModel.physicalProperties.oceanLevel);
        this.setFloat("beachSize", this.colorSettings.beachSize);
        this.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.setFloat("minTemperature", this.planetModel.physicalProperties.minTemperature);
        this.setFloat("maxTemperature", this.planetModel.physicalProperties.maxTemperature);
        this.setFloat("pressure", this.planetModel.physicalProperties.pressure);
        this.setFloat("waterAmount", this.planetModel.physicalProperties.waterAmount);

        this.setFloat(
            "maxElevation",
            this.planetModel.terrainSettings.continent_base_height + this.planetModel.terrainSettings.max_mountain_height + this.planetModel.terrainSettings.max_bump_height
        );
    }

    public update(stellarObjects: Transformable[]) {
        this.stellarObjects = stellarObjects;

        // The add once is important because the material will be bound for every chunk of the planet
        this.onBindObservable.addOnce(() => {
            this.getEffect().setMatrix("planetWorldMatrix", this.planetTransform.getWorldMatrix());

            this.getEffect().setArray3("star_positions", flattenVector3Array(this.stellarObjects.map((star) => star.getTransform().getAbsolutePosition())));
            this.getEffect().setArray3("star_colors", flattenColor3Array(this.stellarObjects.map((star) => (star instanceof Star ? star.model.color : Color3.White()))));
            this.getEffect().setInt("nbStars", this.stellarObjects.length);

            this.getEffect().setVector3("planetPosition", this.planetTransform.getAbsolutePosition());
        });
    }
}
