import { Effect } from "@babylonjs/core";

import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../interfaces";

import atmosphericScatteringFragment from "../../../shaders/atmosphericScatteringFragment.glsl";
import { Planet } from "../../bodies/planets/planet";
import { UberScene } from "../../core/uberScene";
import { StarSystem } from "../../bodies/starSystem";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "../uniforms";
import { UberPostProcess } from "../uberPostProcess";

const shaderName = "atmosphericScattering";
Effect.ShadersStore[`${shaderName}FragmentShader`] = atmosphericScatteringFragment;

export interface AtmosphereSettings {
    atmosphereRadius: number;
    falloffFactor: number;
    intensity: number;
    rayleighStrength: number;
    mieStrength: number;
    densityModifier: number;
    redWaveLength: number;
    greenWaveLength: number;
    blueWaveLength: number;
    mieHaloRadius: number;
}

export class AtmosphericScatteringPostProcess extends UberPostProcess {
    settings: AtmosphereSettings;

    constructor(name: string, planet: Planet, atmosphereHeight: number, scene: UberScene, starSystem: StarSystem) {
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

        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(planet),
            ...getStarsUniforms(starSystem),
            ...getActiveCameraUniforms(scene),
            {
                name: "atmosphereRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.atmosphereRadius;
                }
            },
            {
                name: "falloffFactor",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.falloffFactor;
                }
            },
            {
                name: "sunIntensity",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.intensity;
                }
            },
            {
                name: "rayleighStrength",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.rayleighStrength;
                }
            },
            {
                name: "mieStrength",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.mieStrength;
                }
            },
            {
                name: "densityModifier",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.densityModifier;
                }
            },
            {
                name: "redWaveLength",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.redWaveLength;
                }
            },
            {
                name: "greenWaveLength",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.greenWaveLength;
                }
            },
            {
                name: "blueWaveLength",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.blueWaveLength;
                }
            },
            {
                name: "mieHaloRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.mieHaloRadius;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.settings = settings;

        for (const pipeline of scene.pipelines) {
            pipeline.atmospheres.push(this);
        }
    }
}
