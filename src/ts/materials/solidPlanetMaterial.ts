import { Color3, Effect, MaterialHelper, Scene, ShaderMaterial, Texture, Vector3 } from "@babylonjs/core";
import bottomNormalMap from "../../asset/textures/crackednormal.jpg";
import steepNormalMap from "../../asset/textures/rockn.png";
import grassNormalMap from "../../asset/textures/grassNormalMap.jpg";
import snowNormalMap from "../../asset/textures/snowNormalMap.png";
import snowNormalMap2 from "../../asset/textures/snowNormalMap2.png";
import beachNormalMap from "../../asset/textures/sandNormalMap2.png";
import desertNormalMap from "../../asset/textures/sandNormalMap2.jpg";
import { SolidPlanet } from "../celestialBodies/planets/solidPlanet";
import { ColorMode, ColorSettings } from "./colorSettingsInterface";
import { Algebra } from "../utils/algebra";
import { PlayerController } from "../player/playerController";

import surfaceMaterialFragment from "../../shaders/solidPlanetMaterial.fragment.fx";
import surfaceMaterialVertex from "../../shaders/solidPlanetMaterial.vertex.fx";

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

        this.setTexture("bottomNormalMap", new Texture(bottomNormalMap));
        this.setTexture("steepNormalMap", new Texture(steepNormalMap));
        this.setTexture("plainNormalMap", new Texture(grassNormalMap));

        this.setTexture("snowNormalMap", new Texture(snowNormalMap));
        this.setTexture("snowNormalMap2", new Texture(snowNormalMap2));

        this.setTexture("beachNormalMap", new Texture(beachNormalMap));
        this.setTexture("desertNormalMap", new Texture(desertNormalMap));

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

        this.setColor3("snowColor", this.colorSettings.snowColor);
        this.setColor3("steepColor", this.colorSettings.steepColor);
        this.setColor3("plainColor", this.colorSettings.plainColor);
        this.setColor3("beachColor", this.colorSettings.beachColor);
        this.setColor3("desertColor", this.colorSettings.desertColor);
        this.setColor3("bottomColor", this.colorSettings.bottomColor);

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
