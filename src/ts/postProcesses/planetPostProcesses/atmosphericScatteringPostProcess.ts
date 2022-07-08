import { Effect } from "@babylonjs/core";

import { AtmosphereSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";
import { AbstractPlanet } from "../../bodies/planets/abstractPlanet";

import atmosphericScatteringFragment from "../../../shaders/atmosphericScatteringFragment.glsl";
import { StarSystemManager } from "../../bodies/starSystemManager";

const shaderName = "atmosphericScattering";
Effect.ShadersStore[`${shaderName}FragmentShader`] = atmosphericScatteringFragment;

export class AtmosphericScatteringPostProcess extends PlanetPostProcess {
    settings: AtmosphereSettings;

    constructor(name: string, planet: AbstractPlanet, atmosphereHeight: number, starSystem: StarSystemManager) {
        const settings: AtmosphereSettings = {
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

        const uniforms: ShaderUniformData = {
            atmosphereRadius: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.atmosphereRadius;
                }
            },
            falloffFactor: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.falloffFactor;
                }
            },
            sunIntensity: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.intensity;
                }
            },
            rayleighStrength: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.rayleighStrength;
                }
            },
            mieStrength: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.mieStrength;
                }
            },
            densityModifier: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.densityModifier;
                }
            },
            redWaveLength: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.redWaveLength;
                }
            },
            greenWaveLength: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.greenWaveLength;
                }
            },
            blueWaveLength: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.blueWaveLength;
                }
            },
            mieHaloRadius: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.mieHaloRadius;
                }
            }
        };

        const samplers: ShaderSamplerData = {};

        super(name, shaderName, uniforms, samplers, planet, starSystem.stars[0], starSystem.scene);

        this.settings = settings;

        for (const pipeline of starSystem.pipelines) {
            pipeline.atmospheres.push(this);
        }
    }
}
