import atmosphericScatteringFragment from "../../shaders/atmosphericScatteringFragment.glsl";

import { Effect } from "@babylonjs/core/Materials/effect";
import { UberScene } from "../uberCore/uberScene";
import { Assets } from "../assets";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { centeredRand } from "extended-random";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { ObjectPostProcess } from "./objectPostProcess";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../uberCore/postProcesses/types";
import { Transformable } from "../architecture/transformable";

export interface AtmosphereUniforms {
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
    readonly atmosphereUniforms: AtmosphereUniforms;
    readonly object: TelluricPlanet | GasPlanet;

    constructor(name: string, planet: GasPlanet | TelluricPlanet, atmosphereHeight: number, scene: UberScene, stellarObjects: Transformable[]) {
        const shaderName = "atmosphericScattering";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = atmosphericScatteringFragment;
        }

        const atmosphereUniforms: AtmosphereUniforms = {
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
                name: "atmosphere_radius",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.atmosphereRadius;
                }
            },
            {
                name: "atmosphere_falloff",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.falloffFactor;
                }
            },
            {
                name: "atmosphere_sunIntensity",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.intensity;
                }
            },
            {
                name: "atmosphere_rayleighStrength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.rayleighStrength;
                }
            },
            {
                name: "atmosphere_mieStrength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.mieStrength;
                }
            },
            {
                name: "atmosphere_densityModifier",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.densityModifier;
                }
            },
            {
                name: "atmosphere_redWaveLength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.redWaveLength;
                }
            },
            {
                name: "atmosphere_greenWaveLength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.greenWaveLength;
                }
            },
            {
                name: "atmosphere_blueWaveLength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.blueWaveLength;
                }
            },
            {
                name: "atmosphere_mieHaloRadius",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.mieHaloRadius;
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "atmosphereLUT",
                type: SamplerEnumType.Texture,
                get: () => {
                    return Assets.AtmosphereLUT;
                }
            }
        ];

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.atmosphereUniforms = atmosphereUniforms;
    }
}
