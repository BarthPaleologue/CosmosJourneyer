import { Effect } from "@babylonjs/core";

import atmosphericScatteringFragment from "../../shaders/atmosphericScatteringFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { Assets } from "../assets";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { centeredRand } from "extended-random";
import { BlackHole } from "../bodies/blackHole";
import { Star } from "../bodies/stars/star";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { GasPlanet } from "../bodies/planets/gasPlanet";
import { BodyPostProcess } from "./bodyPostProcess";

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

export class AtmosphericScatteringPostProcess extends BodyPostProcess {
    settings: AtmosphereSettings;

    constructor(name: string, planet: TelluricPlanet | GasPlanet, atmosphereHeight: number, scene: UberScene, stars: (Star | BlackHole)[]) {
        const settings: AtmosphereSettings = {
            atmosphereRadius: planet.getApparentRadius() + atmosphereHeight,
            falloffFactor: 10,
            intensity: 15 * planet.descriptor.physicalProperties.pressure,
            rayleighStrength: 1,
            mieStrength: 1,
            densityModifier: 1,
            redWaveLength: 700 * (1 + centeredRand(planet.descriptor.rng, 1300) / 6),
            greenWaveLength: 530 * (1 + centeredRand(planet.descriptor.rng, 1310) / 6),
            blueWaveLength: 440 * (1 + centeredRand(planet.descriptor.rng, 1320) / 6),
            mieHaloRadius: 0.75
        };

        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(planet),
            ...getStarsUniforms(stars),
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
            },
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "atmosphereLUT",
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.AtmosphereLUT;
                }
            }
        ];

        super(name, planet, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
