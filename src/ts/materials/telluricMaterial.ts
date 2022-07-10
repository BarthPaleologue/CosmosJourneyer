import { Color3, Effect, MaterialHelper, Scene, ShaderMaterial, Vector3 } from "@babylonjs/core";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { ColorMode, ColorSettings } from "./colorSettingsInterface";
import { PlayerController } from "../player/playerController";

import surfaceMaterialFragment from "../../shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../shaders/telluricPlanetMaterial/vertex.glsl";
import { Assets } from "../assets";

const shaderName = "surfaceMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class TelluricMaterial extends ShaderMaterial {
    readonly planet: TelluricPlanet;
    colorSettings: ColorSettings;

    constructor(planet: TelluricPlanet, scene: Scene) {
        super(`${planet.name}SurfaceColor`, scene, shaderName, {
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
                "sunPosition",

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
            beachColor: new Color3(136, 136, 48).scale(1 / 255),
            desertColor: new Color3(178, 107, 42).scale(1 / 255),
            bottomColor: new Color3(0.5, 0.5, 0.5),

            beachSize: 300,
            steepSharpness: 4.5,
            normalSharpness: 0.5
        };

        this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", this.planet.seed);

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.setTexture("bottomNormalMap", Assets.BottomNormalMap);
        this.setTexture("steepNormalMap", Assets.RockNormalMap);
        this.setTexture("plainNormalMap", Assets.GrassNormalMap);

        this.setTexture("snowNormalMap", Assets.SnowNormalMap1);
        this.setTexture("snowNormalMap2", Assets.SnowNormalMap2);

        this.setTexture("beachNormalMap", Assets.SandNormalMap1);
        this.setTexture("desertNormalMap", Assets.SandNormalMap2);

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
        this.setQuaternion("planetInverseRotationQuaternion", this.planet.getInverseRotationQuaternion());
        this.setVector3("playerPosition", player.getAbsolutePosition());
        this.setVector3("sunPosition", starPosition);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
    }
}
