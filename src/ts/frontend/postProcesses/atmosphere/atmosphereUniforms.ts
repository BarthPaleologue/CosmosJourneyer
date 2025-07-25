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

import { type Effect } from "@babylonjs/core/Materials/effect";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Settings } from "@/settings";

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
    ATMOSPHERE_SUN_INTENSITY: "atmosphere_sunIntensity",
};

export class AtmosphereUniforms {
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

    constructor(planetBoundingRadius: number, atmosphereThickness: number) {
        this.atmosphereRadius = planetBoundingRadius + atmosphereThickness;
        this.rayleighHeight = (8e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS;
        this.rayleighScatteringCoefficients = new Vector3(5.8e-6, 13.5e-6, 33.1e-6).scaleInPlace(
            Settings.EARTH_ATMOSPHERE_THICKNESS / atmosphereThickness,
        );

        // https://playerunknownproductions.net/news/atmospheric-scattering
        this.mieHeight = (1.2e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS;
        this.mieScatteringCoefficients = new Vector3(0.00002, 0.00002, 0.00002).scaleInPlace(
            Settings.EARTH_ATMOSPHERE_THICKNESS / atmosphereThickness,
        );
        this.mieAsymmetry = 0.76;

        this.ozoneHeight = (25e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS;
        this.ozoneAbsorptionCoefficients = new Vector3(0.6e-6, 1.8e-6, 0.085e-6).scaleInPlace(
            Settings.EARTH_ATMOSPHERE_THICKNESS / atmosphereThickness,
        );
        this.ozoneFalloff = (5e3 * atmosphereThickness) / Settings.EARTH_ATMOSPHERE_THICKNESS;
        this.lightIntensity = 15;
    }

    setUniforms(effect: Effect) {
        effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_RADIUS, this.atmosphereRadius);
        effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_RAYLEIGH_HEIGHT, this.rayleighHeight);
        effect.setVector3(AtmosphereUniformNames.ATMOSPHERE_RAYLEIGH_COEFFS, this.rayleighScatteringCoefficients);
        effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_MIE_HEIGHT, this.mieHeight);
        effect.setVector3(AtmosphereUniformNames.ATMOSPHERE_MIE_COEFFS, this.mieScatteringCoefficients);
        effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_MIE_ASYMMETRY, this.mieAsymmetry);
        effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_OZONE_HEIGHT, this.ozoneHeight);
        effect.setVector3(AtmosphereUniformNames.ATMOSPHERE_OZONE_COEFFS, this.ozoneAbsorptionCoefficients);
        effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_OZONE_FALLOFF, this.ozoneFalloff);
        effect.setFloat(AtmosphereUniformNames.ATMOSPHERE_SUN_INTENSITY, this.lightIntensity);
    }

    getUniformNames(): string[] {
        return Object.values(AtmosphereUniformNames);
    }
}
