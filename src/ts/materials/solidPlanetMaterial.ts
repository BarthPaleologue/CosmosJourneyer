import { Color3, Effect, MaterialHelper, Scene, ShaderMaterial, Vector3 } from "@babylonjs/core";
import { SolidPlanet } from "../celestialBodies/planets/solidPlanet";
import { ColorMode, ColorSettings } from "./colorSettingsInterface";
import { Algebra } from "../utils/algebra";
import { PlayerController } from "../player/playerController";

import surfaceMaterialFragment from "../../shaders/solidPlanetMaterial.fragment.fx";
import surfaceMaterialVertex from "../../shaders/solidPlanetMaterial.vertex.fx";
import { AssetsManager } from "../assetsManager";

const shaderName = "surfaceMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class SolidPlanetMaterial extends ShaderMaterial {
    readonly planet: SolidPlanet;
    colorSettings: ColorSettings;

    constructor(planet: SolidPlanet, scene: Scene) {
        super(`${planet.getName()}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
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
            steepColor: new Color3(55, 42, 42).scale(1 / 255),
            plainColor: new Color3(56, 94, 6).scale(1 / 255),
            beachColor: new Color3(0.7, 0.7, 0.2),
            desertColor: new Color3(178, 107, 42).scale(1 / 255),
            bottomColor: new Color3(0.5, 0.5, 0.5),

            beachSize: 300,
            steepSharpness: 2,
            normalSharpness: 0.5
        };

        this.onBindObservable.add(() => {
            let effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setVector3("seed", Vector3.FromArray(this.planet.getSeed()));

        if(!AssetsManager.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.setTexture("bottomNormalMap", AssetsManager.BottomNormalMap!);
        this.setTexture("steepNormalMap", AssetsManager.RockNormalMap!);
        this.setTexture("plainNormalMap", AssetsManager.GrassNormalMap!);

        this.setTexture("snowNormalMap", AssetsManager.SnowNormalMap1!);
        this.setTexture("snowNormalMap2", AssetsManager.SnowNormalMap2!);

        this.setTexture("beachNormalMap", AssetsManager.SandNormalMap1!);
        this.setTexture("desertNormalMap", AssetsManager.SnowNormalMap2!);

        this.setColor3("snowColor", this.colorSettings.snowColor);
        this.setColor3("steepColor", this.colorSettings.steepColor);
        this.setColor3("plainColor", this.colorSettings.plainColor);
        this.setColor3("beachColor", this.colorSettings.beachColor);
        this.setColor3("desertColor", this.colorSettings.desertColor);
        this.setColor3("bottomColor", this.colorSettings.bottomColor);

        this.setVector3("playerPosition", Vector3.Zero());
        this.setVector3("sunPosition", Vector3.Zero());
        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
        this.setFloat("planetRadius", this.planet.getRadius());

        this.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        // TODO: déharcoder le bouzin
        this.setFloat("maxElevation", this.planet.terrainSettings.continentBaseHeight + this.planet.terrainSettings.maxMountainHeight + this.planet.terrainSettings.maxBumpHeight);

        this.updateManual();
    }

    public updateManual(): void {
        //TODO: when the code is robust enough, get rid of this method
        this.setInt("colorMode", this.colorSettings.mode);

        this.setFloat("waterLevel", this.planet.oceanLevel);
        this.setFloat("beachSize", this.colorSettings.beachSize);
        this.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        this.setFloat("minTemperature", this.planet.physicalProperties.minTemperature);
        this.setFloat("maxTemperature", this.planet.physicalProperties.maxTemperature);
        this.setFloat("pressure", this.planet.physicalProperties.pressure);
        this.setFloat("waterAmount", this.planet.physicalProperties.waterAmount);
    }

    public update(player: PlayerController, starPosition: Vector3) {
        this.setVector4("planetInverseRotationQuaternion", Algebra.QuaternionAsVector4(this.planet.getInverseRotationQuaternion()));

        this.setVector3("playerPosition", player.getAbsolutePosition());
        this.setVector3("sunPosition", starPosition);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
    }
}
