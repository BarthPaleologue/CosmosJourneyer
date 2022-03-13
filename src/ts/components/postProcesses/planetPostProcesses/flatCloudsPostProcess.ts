import {Scene, Texture} from "@babylonjs/core";

import {CloudSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "../interfaces";
import {SolidPlanet} from "../../celestialBodies/planets/solid/solidPlanet";
import waterbump from "../../../../asset/textures/cloudNormalMap.jpg";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";

export class FlatCloudsPostProcess extends PlanetPostProcess {

    settings: CloudSettings;

    internalTime: number;

    constructor(name: string, planet: SolidPlanet, cloudLayerRadius: number, sun: Star, scene: Scene) {

        let settings = {
            cloudLayerRadius: cloudLayerRadius,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 3,
            cloudDetailFrequency: 15.0,
            cloudPower: 5,
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
                    return this.internalTime
                }
            }
        };

        let samplers: ShaderSamplerData = {
            "normalMap": {
                type: ShaderDataType.Texture,
                get: () => {return new Texture(waterbump, scene)}
            }
        }

        super(name, "./shaders/flatClouds", planet, sun, uniforms, samplers, scene);

        this.internalTime = 0;

        this.settings = settings;
    }
}