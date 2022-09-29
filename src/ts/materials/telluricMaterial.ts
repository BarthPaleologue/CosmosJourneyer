import { Color3, Effect, MaterialHelper, ShaderMaterial } from "@babylonjs/core";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { ColorMode, ColorSettings } from "./colorSettingsInterface";
import { AbstractController } from "../controllers/abstractController";

import surfaceMaterialFragment from "../../shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../shaders/telluricPlanetMaterial/vertex.glsl";
import { Assets } from "../assets";
import { flattenVector3Array } from "../utils/algebra";
import { UberScene } from "../core/uberScene";

const shaderName = "surfaceMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class TelluricMaterial extends ShaderMaterial {
    readonly planet: TelluricPlanet;
    colorSettings: ColorSettings;

    constructor(planet: TelluricPlanet, scene: UberScene) {
        super(`${planet.name}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [
                "world",
                "worldViewProjection",
                "projection",
                "view",

                "textureSampler",
                "depthSampler",

                "colorMode",

                "bottomNormalMap",
                "plainNormalMap",
                "beachNormalMap",
                "desertNormalMap",
                "snowNormalMap",
                "snowNormalMap2",
                "steepNormalMap",

                "seed",

                "cameraNear",
                "cameraFar",
                "planetPosition",
                "planetRadius",

                "starPositions",
                "nbStars",

                "planetInverseRotationQuaternion",

                "playerPosition",

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

                "waterAmount",

                "logarithmicDepthConstant"
            ],
            defines: ["#define LOGARITHMICDEPTH"]
        });

        this.planet = planet;
        this.colorSettings = {
            mode: ColorMode.DEFAULT,

            snowColor: new Color3(1, 1, 1),
            steepColor: new Color3(115, 100, 100).scaleInPlace(1 / 255),
            plainColor: new Color3(56, 94, 6).scaleInPlace(1 / 255),
            beachColor: new Color3(136, 136, 48).scaleInPlace(1 / 255),
            desertColor: new Color3(178, 107, 42).scaleInPlace(1 / 255),
            bottomColor: new Color3(0.5, 0.5, 0.5),

            beachSize: 500,
            steepSharpness: 2,
            normalSharpness: 0.5
        };

        this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", this.planet.seed);

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.setColor3("snowColor", this.colorSettings.snowColor);
        this.setColor3("steepColor", this.colorSettings.steepColor);
        this.setColor3("plainColor", this.colorSettings.plainColor);
        this.setColor3("beachColor", this.colorSettings.beachColor);
        this.setColor3("desertColor", this.colorSettings.desertColor);
        this.setColor3("bottomColor", this.colorSettings.bottomColor);

        this.setVector3("playerPosition", scene.getController().getActiveCamera().position);

        this.setArray3("starPositions", flattenVector3Array(this.planet.starSystem.stars.map((star) => star.getAbsolutePosition())));

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());

        this.updateConstants();
    }

    public updateConstants(): void {
        this.setFloat("planetRadius", this.planet.getRadius());

        this.setInt("colorMode", this.colorSettings.mode);

        this.setFloat("waterLevel", this.planet.oceanLevel);
        this.setFloat("beachSize", this.colorSettings.beachSize);
        this.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        this.setTexture("bottomNormalMap", Assets.BottomNormalMap);
        this.setTexture("steepNormalMap", Assets.RockNormalMap);
        this.setTexture("plainNormalMap", Assets.GrassNormalMap);

        this.setTexture("snowNormalMap", Assets.SnowNormalMap1);
        this.setTexture("snowNormalMap2", Assets.SnowNormalMap2);

        this.setTexture("beachNormalMap", Assets.SandNormalMap1);
        this.setTexture("desertNormalMap", Assets.SandNormalMap2);

        this.setFloat("minTemperature", this.planet.physicalProperties.minTemperature);
        this.setFloat("maxTemperature", this.planet.physicalProperties.maxTemperature);
        this.setFloat("pressure", this.planet.physicalProperties.pressure);
        this.setFloat("waterAmount", this.planet.physicalProperties.waterAmount);

        this.setFloat("maxElevation", this.planet.terrainSettings.continentBaseHeight + this.planet.terrainSettings.maxMountainHeight + this.planet.terrainSettings.maxBumpHeight);
    }

    public update(player: AbstractController) {
        this.setQuaternion("planetInverseRotationQuaternion", this.planet.getInverseRotationQuaternion());
        this.setVector3("playerPosition", player.transform.getAbsolutePosition());

        this.setArray3("starPositions", flattenVector3Array(this.planet.starSystem.stars.map((star) => star.getAbsolutePosition())));
        this.setInt("nbStars", this.planet.starSystem.stars.length);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
    }
}
