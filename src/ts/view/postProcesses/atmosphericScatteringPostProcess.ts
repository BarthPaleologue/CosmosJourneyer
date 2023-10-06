import atmosphericScatteringFragment from "../../../shaders/atmosphericScatteringFragment.glsl";

import { Effect } from "@babylonjs/core/Materials/effect";
import { UberScene } from "../../controller/uberCore/uberScene";
import { Assets } from "../../controller/assets";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { centeredRand } from "extended-random";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { GasPlanet } from "../bodies/planemos/gasPlanet";
import { ObjectPostProcess } from "./objectPostProcess";
import { OrbitalObject } from "../common";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../../controller/uberCore/postProcesses/types";

const shaderName = "atmosphericScattering";
Effect.ShadersStore[`${shaderName}FragmentShader`] = atmosphericScatteringFragment;

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
    readonly object: TelluricPlanemo | GasPlanet;

    constructor(name: string, planet: TelluricPlanemo | GasPlanet, atmosphereHeight: number, scene: UberScene, stellarObjects: OrbitalObject[]) {
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
                name: "atmosphere.radius",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.atmosphereRadius;
                }
            },
            {
                name: "atmosphere.falloff",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.falloffFactor;
                }
            },
            {
                name: "atmosphere.sunIntensity",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.intensity;
                }
            },
            {
                name: "atmosphere.rayleighStrength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.rayleighStrength;
                }
            },
            {
                name: "atmosphere.mieStrength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.mieStrength;
                }
            },
            {
                name: "atmosphere.densityModifier",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.densityModifier;
                }
            },
            {
                name: "atmosphere.redWaveLength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.redWaveLength;
                }
            },
            {
                name: "atmosphere.greenWaveLength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.greenWaveLength;
                }
            },
            {
                name: "atmosphere.blueWaveLength",
                type: UniformEnumType.Float,
                get: () => {
                    return atmosphereUniforms.blueWaveLength;
                }
            },
            {
                name: "atmosphere.mieHaloRadius",
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
