//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
            mieHaloRadius: 0.65
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
