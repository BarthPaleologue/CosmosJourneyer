//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import atmosphericScatteringFragment from "../../shaders/atmosphericScatteringFragment.glsl";

import { Effect } from "@babylonjs/core/Materials/effect";
import { centeredRand } from "extended-random";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { ObjectPostProcess } from "./objectPostProcess";
import { Transformable } from "../architecture/transformable";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "./uniforms/stellarObjectUniforms";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Scene } from "@babylonjs/core/scene";
import { Textures } from "../assets/textures";

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

export class AtmosphericScatteringPostProcess extends PostProcess implements ObjectPostProcess {
    readonly atmosphereUniforms: AtmosphereUniforms;
    readonly object: TelluricPlanet | GasPlanet;

    private activeCamera: Camera | null = null;

    constructor(name: string, planet: GasPlanet | TelluricPlanet, atmosphereHeight: number, scene: Scene, stellarObjects: Transformable[]) {
        const shaderName = "atmosphericScattering";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = atmosphericScatteringFragment;
        }

        const atmosphereUniforms: AtmosphereUniforms = {
            atmosphereRadius: planet.getBoundingRadius() + atmosphereHeight,
            falloffFactor: 10,
            intensity: 11 * planet.model.physicalProperties.pressure,
            rayleighStrength: 3,
            mieStrength: 1,
            densityModifier: 1,
            redWaveLength: 700 * (1 + centeredRand(planet.model.rng, 1300) / 6),
            greenWaveLength: 530 * (1 + centeredRand(planet.model.rng, 1310) / 6),
            blueWaveLength: 440 * (1 + centeredRand(planet.model.rng, 1320) / 6),
            mieHaloRadius: 0.65
        };

        const AtmosphereUniformNames = {
            ATMOSPHERE_RADIUS: "atmosphere_radius",
            ATMOSPHERE_FALLOFF: "atmosphere_falloff",
            ATMOSPHERE_SUN_INTENSITY: "atmosphere_sunIntensity",
            ATMOSPHERE_RAYLEIGH_STRENGTH: "atmosphere_rayleighStrength",
            ATMOSPHERE_MIE_STRENGTH: "atmosphere_mieStrength",
            ATMOSPHERE_DENSITY_MODIFIER: "atmosphere_densityModifier",
            ATMOSPHERE_RED_WAVE_LENGTH: "atmosphere_redWaveLength",
            ATMOSPHERE_GREEN_WAVE_LENGTH: "atmosphere_greenWaveLength",
            ATMOSPHERE_BLUE_WAVE_LENGTH: "atmosphere_blueWaveLength",
            ATMOSPHERE_MIE_HALO_RADIUS: "atmosphere_mieHaloRadius"
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(AtmosphereUniformNames)
        ];

        const AtmosphereSamplerNames = {
            ATMOSPHERE_LUT: "atmosphereLUT"
        };

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(AtmosphereSamplerNames)];

        super(name, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = planet;
        this.atmosphereUniforms = atmosphereUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, planet);

            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_RADIUS, atmosphereUniforms.atmosphereRadius);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_FALLOFF, atmosphereUniforms.falloffFactor);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_SUN_INTENSITY, atmosphereUniforms.intensity);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_RAYLEIGH_STRENGTH, atmosphereUniforms.rayleighStrength);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_MIE_STRENGTH, atmosphereUniforms.mieStrength);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_DENSITY_MODIFIER, atmosphereUniforms.densityModifier);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_RED_WAVE_LENGTH, atmosphereUniforms.redWaveLength);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_GREEN_WAVE_LENGTH, atmosphereUniforms.greenWaveLength);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_BLUE_WAVE_LENGTH, atmosphereUniforms.blueWaveLength);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_MIE_HALO_RADIUS, atmosphereUniforms.mieHaloRadius);

            effect.setTexture(AtmosphereSamplerNames.ATMOSPHERE_LUT, Textures.ATMOSPHERE_LUT);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
