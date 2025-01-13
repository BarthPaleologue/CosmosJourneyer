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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Settings } from "../settings";
import { OrbitalObjectModel } from "../architecture/orbitalObject";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export type AtmosphereUniforms = {
    /**
     * Radius of the atmosphere in meters (planetRadius + 100km in the case of Earth)
     */
    atmosphereRadius: number;

    /**
     * Height falloff of rayleigh scattering (bigger = slower decrease)
     */
    rayleighHeight: number;

    /**
     * Rayleigh scattering coefficients (red, green, blue)
     * @see https://sebh.github.io/publications/egsr2020.pdf (Hillaire 2020)
     */
    rayleighScatteringCoefficients: Vector3;

    /**
     * Height falloff of mie scattering (bigger = slower decrease)
     */
    mieHeight: number;

    /**
     * Mie scattering coefficients (red, green, blue)
     */
    mieScatteringCoefficients: Vector3;

    /**
     * Mie scattering asymmetry factor (between -1 and 1)
     */
    mieAsymmetry: number;

    /**
     * Height of the ozone layer in meters above the planet surface
     */
    ozoneHeight: number;

    /**
     * Ozone absorption coefficients (red, green, blue)
     * @see https://sebh.github.io/publications/egsr2020.pdf (Hillaire 2020)
     */
    ozoneAbsorptionCoefficients: Vector3;

    /**
     * Ozone absorption falloff around the ozone layer height (in meters)
     */
    ozoneFalloff: number;

    /**
     * Intensity of the sun
     */
    lightIntensity: number;
};

export class AtmosphericScatteringPostProcess extends PostProcess {
    readonly atmosphereUniforms: AtmosphereUniforms;

    private activeCamera: Camera | null = null;

    constructor(
        planetTransform: TransformNode,
        planetBoundingRadius: number,
        planetModel: OrbitalObjectModel,
        atmosphereThickness: number,
        stellarObjects: Transformable[],
        scene: Scene
    ) {
        const shaderName = "atmosphericScattering";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = atmosphericScatteringFragment;
        }

        const atmosphereUniforms: AtmosphereUniforms = {
            atmosphereRadius: planetBoundingRadius + atmosphereThickness,
            rayleighHeight: (8e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS,
            rayleighScatteringCoefficients: new Vector3(5.8e-6, 13.5e-6, 33.1e-6).scaleInPlace(Settings.EARTH_ATMOSPHERE_THICKNESS / atmosphereThickness),
            mieHeight: (1.2e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS,
            mieScatteringCoefficients: new Vector3(3.9e-6, 3.9e-6, 3.9e-6).scaleInPlace(Settings.EARTH_ATMOSPHERE_THICKNESS / atmosphereThickness),
            mieAsymmetry: 0.8,
            ozoneHeight: (25e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS,
            ozoneAbsorptionCoefficients: new Vector3(0.6e-6, 1.8e-6, 0.085e-6).scaleInPlace(Settings.EARTH_ATMOSPHERE_THICKNESS / atmosphereThickness),
            ozoneFalloff: (5e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS,
            lightIntensity: 15
        };

        const AtmosphereUniformNames = {
            ATMOSPHERE_RADIUS: "atmosphere_radius",
            ATMOSPHERE_RAYLEIGH_HEIGHT: "atmosphere_rayleighHeight",
            ATMOSPHERE_RAYLEIGH_COEFFS: "atmosphere_rayleighCoeffs",
            ATMOSPHERE_MIE_HEIGHT: "atmosphere_mieHeight",
            ATMOSPHERE_MIE_COEFFS: "atmosphere_mieCoeffs",
            ATMOSPHERE_MIE_ASYMMETRY: "atmosphere_mieAsymmetry",
            ATMOSPHERE_OZONE_HEIGHT: "atmosphere_ozoneHeight",
            ATMOSPHERE_OZONE_COEFFS: "atmosphere_ozoneCoeffs",
            ATMOSPHERE_OZONE_FALLOFF: "atmosphere_ozoneFalloff",
            ATMOSPHERE_SUN_INTENSITY: "atmosphere_sunIntensity"
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

        super(
            `${planetModel.name}AtmospherePostProcess`,
            shaderName,
            uniforms,
            samplers,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT
        );

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
            setObjectUniforms(effect, planetTransform, planetBoundingRadius);

            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_RADIUS, atmosphereUniforms.atmosphereRadius);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_RAYLEIGH_HEIGHT, atmosphereUniforms.rayleighHeight);
            effect.setVector3(AtmosphereUniformNames.ATMOSPHERE_RAYLEIGH_COEFFS, atmosphereUniforms.rayleighScatteringCoefficients);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_MIE_HEIGHT, atmosphereUniforms.mieHeight);
            effect.setVector3(AtmosphereUniformNames.ATMOSPHERE_MIE_COEFFS, atmosphereUniforms.mieScatteringCoefficients);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_MIE_ASYMMETRY, atmosphereUniforms.mieAsymmetry);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_OZONE_HEIGHT, atmosphereUniforms.ozoneHeight);
            effect.setVector3(AtmosphereUniformNames.ATMOSPHERE_OZONE_COEFFS, atmosphereUniforms.ozoneAbsorptionCoefficients);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_OZONE_FALLOFF, atmosphereUniforms.ozoneFalloff);
            effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_SUN_INTENSITY, atmosphereUniforms.lightIntensity);

            effect.setTexture(AtmosphereSamplerNames.ATMOSPHERE_LUT, Textures.ATMOSPHERE_LUT);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
