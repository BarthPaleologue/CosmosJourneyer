import {Scene} from "@babylonjs/core";

import { SolidPlanet } from "../../celestialBodies/planets/solid/solidPlanet";

import {AtmosphereSettings, ShaderUniformData, ShaderSamplerData, ShaderDataType} from "../interfaces";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";

export class AtmosphericScatteringPostProcess extends PlanetPostProcess {

    settings: AtmosphereSettings;

    constructor(name: string, planet: SolidPlanet, atmosphereRadius: number, sun: Star, scene: Scene) {

        let settings: AtmosphereSettings = {
            atmosphereRadius: atmosphereRadius,
            falloffFactor: 23,
            intensity: 12,
            scatteringStrength: 1,
            densityModifier: 1,
            redWaveLength: 700,
            greenWaveLength: 530,
            blueWaveLength: 440,
        };

        let uniforms: ShaderUniformData = {
            "atmosphereRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.atmosphereRadius}
            },
            "falloffFactor": {
                type: ShaderDataType.Float,
                get: () => {return settings.falloffFactor}
            },
            "sunIntensity": {
                type: ShaderDataType.Float,
                get: () => {return settings.intensity}
            },
            "scatteringStrength": {
                type: ShaderDataType.Float,
                get: () => {return settings.scatteringStrength}
            },
            "densityModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.densityModifier}
            },
            "redWaveLength": {
                type: ShaderDataType.Float,
                get: () => {return settings.redWaveLength}
            },
            "greenWaveLength": {
                type: ShaderDataType.Float,
                get: () => {return settings.greenWaveLength}
            },
            "blueWaveLength": {
                type: ShaderDataType.Float,
                get: () => {return settings.blueWaveLength}
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/simplifiedScattering", uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}