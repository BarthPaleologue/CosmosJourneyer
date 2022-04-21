import {Scene, Texture, Vector3} from "@babylonjs/core";

import {CloudSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "../interfaces";
import {SolidPlanet} from "../../celestialBodies/planets/solid/solidPlanet";
import normalMap from "../../../../asset/textures/cloudNormalMap2.jpg";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";

export class FlatCloudsPostProcess extends PlanetPostProcess {

    settings: CloudSettings;

    internalTime: number;

    constructor(name: string, planet: SolidPlanet, cloudLayerRadius: number, sun: Star, scene: Scene) {

        let settings: CloudSettings = {
            cloudLayerRadius: cloudLayerRadius,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 4,
            cloudDetailFrequency: 20,
            cloudPower: 2,
            cloudSharpness: 7,
            cloudColor: new Vector3(0.8, 0.8, 0.8),
            worleySpeed: 0.5,
            detailSpeed: 1.0,
        };

        let uniforms: ShaderUniformData = {
            "cloudLayerRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudLayerRadius}
            },
            "cloudFrequency": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudFrequency}
            },
            "cloudDetailFrequency": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudDetailFrequency}
            },
            "cloudPower": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudPower}
            },
            "cloudSharpness": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudSharpness}
            },
            "cloudColor": {
                type: ShaderDataType.Vector3,
                get: () => {return settings.cloudColor}
            },
            "worleySpeed": {
                type: ShaderDataType.Float,
                get: () => {return settings.worleySpeed}
            },
            "detailSpeed": {
                type: ShaderDataType.Float,
                get: () => {return settings.detailSpeed}
            },
            "smoothness": {
                type: ShaderDataType.Float,
                get: () => {return settings.smoothness}
            },
            "specularPower": {
                type: ShaderDataType.Float,
                get: () => {return settings.specularPower}
            },
            "planetWorldMatrix": {
                type: ShaderDataType.Matrix,
                get: () => {return planet.getWorldMatrix()}
            },
            "time": {
                type: ShaderDataType.Float,
                get: () => {
                    this.internalTime += scene.getEngine().getDeltaTime() / 1000;
                    return this.internalTime;
                }
            }
        };

        let samplers: ShaderSamplerData = {
            "normalMap": {
                type: ShaderDataType.Texture,
                get: () => {return new Texture(normalMap, scene)}
            }
        }

        super(name, "./shaders/flatClouds", uniforms, samplers, planet, sun, scene);

        this.internalTime = 0;

        this.settings = settings;
    }
}