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
                "normalMatrix",

                "colorMode",

                "seed",

                "cameraNear",
                "cameraFar",
                "planetPosition",
                "planetRadius",

                "star_positions",
                "star_colors",
                "nbStars",

                "inversePlanetWorldMatrix",

                "waterLevel",
                "beachSize",
                "steepSharpness",
                "normalSharpness",

                "snowColor",
                "steepColor",
                "plainColor",
                "beachColor",
                "desertColor",
                "bottomColor",

                "maxElevation",

                "minTemperature",
                "maxTemperature",
                "pressure",

                "waterAmount"
            ],
            samplers: ["lut", "bottomNormalMap",

                "plainAlbedoMap",
                "plainNormalMap",
                "plainRoughnessMap",
                "plainMetallicMap",

                "beachNormalMap",

                "desertNormalMap",
                "desertAlbedoMap",
                "desertRoughnessMap",
                "desertMetallicMap",

                "snowNormalMap",

                "steepNormalMap",
                "steepAlbedoMap",
                "steepRoughnessMap",
                "steepMetallicMap"
            ]
        });

        this.planetModel = model;
        this.planetTransform = planet;

        this.colorSettings = {
            mode: ColorMode.DEFAULT,

            snowColor: new Color3(0.9, 0.9, 0.9),
            steepColor: new Color3(60, 60, 60).scaleInPlace(1.5 / 255),
            plainColor: new Color3(
                //TODO: make this better
                1.5 * Math.max(0.22 + centeredRand(model.rng, 82) / 20, 0),
                1.5 * Math.max(0.37 + centeredRand(model.rng, 83) / 20, 0),
                1.5 * Math.max(0.024 + centeredRand(model.rng, 84) / 20, 0)
            ),
            beachColor: new Color3(132, 114, 46).scaleInPlace(1 / 255),
            desertColor: new Color3(232, 142, 59).scaleInPlace(1 / 255),
            bottomColor: new Color3(0.5, 0.5, 0.5),

            beachSize: 100 + 50 * centeredRand(model.rng, 85),
            steepSharpness: 2,
            normalSharpness: 0.5
        };

        if (model.physicalProperties.oceanLevel === 0) {
            // sterile world
            this.colorSettings.plainColor = Color3.FromHSV(model.rng(666) * 360, 0.2, normalRandom(0.3, 0.1, model.rng, 86) * 0.5 + 0.5);
            this.colorSettings.beachColor = this.colorSettings.plainColor.scale(0.9);
            this.colorSettings.desertColor = this.colorSettings.plainColor.clone();
            this.colorSettings.bottomColor = this.colorSettings.plainColor.scale(0.8);
        }

        this.setFloat("seed", model.seed);

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.setColor3("snowColor", this.colorSettings.snowColor);
        this.setColor3("steepColor", this.colorSettings.steepColor);
        this.setColor3("plainColor", this.colorSettings.plainColor);
        this.setColor3("beachColor", this.colorSettings.beachColor);
        this.setColor3("desertColor", this.colorSettings.desertColor);
        this.setColor3("bottomColor", this.colorSettings.bottomColor);

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

        this.updateConstants();
    }

    public updateConstants(): void {
        this.setFloat("planetRadius", this.planetModel.radius);

        this.setInt("colorMode", this.colorSettings.mode);

        this.setFloat("waterLevel", this.planetModel.physicalProperties.oceanLevel);
        this.setFloat("beachSize", this.colorSettings.beachSize);
        this.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        this.setTexture("bottomNormalMap", Assets.BOTTOM_NORMAL_MAP);

        this.setTexture("steepNormalMap", Assets.ROCK_NORMAL_MAP);
        this.setTexture("steepAlbedoMap", Assets.ROCK_ALBEDO_MAP);
        this.setTexture("steepRoughnessMap", Assets.ROCK_ROUGHNESS_MAP);
        this.setTexture("steepMetallicMap", Assets.ROCK_METALLIC_MAP);

        this.setTexture("plainNormalMap", Assets.GRASS_NORMAL_MAP);
        this.setTexture("plainAlbedoMap", Assets.GRASS_ALBEDO_MAP);
        this.setTexture("plainRoughnessMap", Assets.GRASS_ROUGHNESS_MAP);
        this.setTexture("plainMetallicMap", Assets.GRASS_METALLIC_MAP);

        this.setTexture("snowNormalMap", Assets.SNOW_NORMAL_MAP_1);
        this.setTexture("beachNormalMap", Assets.SAND_NORMAL_MAP);

        this.setTexture("desertNormalMap", Assets.SAND_NORMAL_MAP);
        this.setTexture("desertAlbedoMap", Assets.SAND_ALBEDO_MAP);
        this.setTexture("desertRoughnessMap", Assets.SAND_ROUGHNESS_MAP);
        this.setTexture("desertMetallicMap", Assets.SAND_METALLIC_MAP);

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
        // we don't want to compute the same matrix inverse for every chunk
        this.onBindObservable.addOnce(() => {
            const inversePlanetWorldMatrix = this.planetTransform.getWorldMatrix().clone().invert();
            this.getEffect().setMatrix("normalMatrix", inversePlanetWorldMatrix.transpose());
            this.getEffect().setMatrix("inversePlanetWorldMatrix", inversePlanetWorldMatrix);

            this.getEffect().setArray3("star_positions", flattenVector3Array(this.stellarObjects.map((star) => star.getTransform().getAbsolutePosition())));
            this.getEffect().setArray3("star_colors", flattenColor3Array(this.stellarObjects.map((star) => (star instanceof Star ? star.model.color : Color3.White()))));
            this.getEffect().setInt("nbStars", this.stellarObjects.length);

            this.getEffect().setVector3("planetPosition", this.planetTransform.getAbsolutePosition());
        });
    }
}
