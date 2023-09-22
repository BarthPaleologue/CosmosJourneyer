import atmosphericScatteringFragment from "../../../shaders/atmosphericScatteringFragment.glsl";

import { Effect } from "@babylonjs/core/Materials/effect";
import { UberScene } from "../../controller/uberCore/uberScene";
import { Assets } from "../../controller/assets";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms, UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { centeredRand } from "extended-random";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { GasPlanet } from "../bodies/planemos/gasPlanet";
import { ObjectPostProcess } from "./objectPostProcess";
import { OrbitalObject } from "../common";

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

export class AtmosphericScatteringPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: AtmosphereSettings;
    readonly object: TelluricPlanemo | GasPlanet;

    constructor(name: string, planet: TelluricPlanemo | GasPlanet, atmosphereHeight: number, scene: UberScene, stellarObjects: OrbitalObject[]) {
        const settings: AtmosphereSettings = {
            atmosphereRadius: planet.getBoundingRadius() + atmosphereHeight,
            falloffFactor: 10,
            intensity: 11 * planet.model.physicalProperties.pressure,
            rayleighStrength: 1,
            mieStrength: 1,
            densityModifier: 1,
            redWaveLength: 700 * (1 + centeredRand(planet.model.rng, 1300) / 6),
            greenWaveLength: 530 * (1 + centeredRand(planet.model.rng, 1310) / 6),
            blueWaveLength: 440 * (1 + centeredRand(planet.model.rng, 1320) / 6),
            mieHaloRadius: 0.6
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stellarObjects),
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

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.settings = settings;
    }
}
