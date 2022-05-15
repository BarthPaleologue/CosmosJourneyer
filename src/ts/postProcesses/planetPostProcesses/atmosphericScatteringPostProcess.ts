import {Scene} from "@babylonjs/core";

import {AtmosphereSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "../interfaces";
import {PlanetPostProcess} from "../planetPostProcess";
import {Star} from "../../celestialBodies/stars/star";
import {AbstractPlanet} from "../../celestialBodies/planets/abstractPlanet";

export class AtmosphericScatteringPostProcess extends PlanetPostProcess {

    settings: AtmosphereSettings;

    constructor(name: string, planet: AbstractPlanet, atmosphereHeight: number, sun: Star, scene: Scene) {

        let settings: AtmosphereSettings = {
            atmosphereRadius: planet.getApparentRadius() + atmosphereHeight,
            falloffFactor: 23,
            intensity: 12,
            rayleighStrength: 1,
            mieStrength: 1,
            densityModifier: 1,
            redWaveLength: 700,
            greenWaveLength: 530,
            blueWaveLength: 440,
            mieHaloRadius: 0.75
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
            "rayleighStrength": {
                type: ShaderDataType.Float,
                get: () => {return settings.rayleighStrength}
            },
            "mieStrength": {
                type: ShaderDataType.Float,
                get: () => {return settings.mieStrength}
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
            },
            "mieHaloRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.mieHaloRadius}
            },
            "planetsData": {
                // TODO: implement that for real
                type: ShaderDataType.FloatArray,
                get: () => {return []}
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/atmosphericScattering", uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}