import {Scene, Texture} from "@babylonjs/core";

import waterNormal1 from "../../../../asset/textures/waterbump.png";
import waterNormal2 from "../../../../asset/textures/waterNormal2.png";
import {SolidPlanet} from "../../celestialBodies/planets/solid/solidPlanet";
import {OceanSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "../interfaces";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";

export class OceanPostProcess extends PlanetPostProcess {

    settings: OceanSettings;

    constructor(name: string, planet: SolidPlanet, sun: Star, scene: Scene) {

        let settings: OceanSettings = {
            oceanRadius: planet.getRadius(),
            depthModifier: 0.002,
            alphaModifier: 0.007,
            specularPower: 1.5,
            smoothness: 0.9,
            waveBlendingSharpness: 0.5,
        };

        let uniforms: ShaderUniformData = {
            "oceanRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.oceanRadius}
            },

            "smoothness": {
                type: ShaderDataType.Float,
                get: () => {return settings.smoothness}
            },
            "specularPower": {
                type: ShaderDataType.Float,
                get: () => {return settings.specularPower}
            },
            "alphaModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.alphaModifier}
            },
            "depthModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.depthModifier}
            },
            "waveBlendingSharpness": {
                type: ShaderDataType.Float,
                get: () => {return settings.waveBlendingSharpness}
            },

            "planetWorldMatrix": {
                type: ShaderDataType.Matrix,
                get: () => {return planet.getWorldMatrix()}
            },

            "time": {
                type: ShaderDataType.Float,
                get: () => {return this.internalTime}
            }
        };

        let samplers: ShaderSamplerData = {
            "normalMap1": {
                type: ShaderDataType.Texture,
                get: () => {return new Texture(waterNormal1, scene)}
            },
            "normalMap2": {
                type: ShaderDataType.Texture,
                get: () => {return new Texture(waterNormal2, scene)}
            }
        }

        super(name, "./shaders/ocean", uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}