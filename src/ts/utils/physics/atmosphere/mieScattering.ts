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

import { DeepReadonly } from "@/utils/types";

import { PresetBands } from "./common";

// Earth calibration constants
const betaEarth = 7.5e-5; // grey Earth Mie
const tauEarth = 0.15; // MODIS global mean AOD 550 nm (see https://svs.gsfc.nasa.gov/12302)
const HEarth = 2.0; // km

/**
 *
 * @param waveLength The wavelength in metres (e.g. 680e-9 for red, 550e-9 for green, 440e-9 for blue)
 * @param tauP The vertical aerosol optical depth at 550 nm for the planet
 * @param HP The effective aerosol scale-height (km) for the planet
 * @param alphaP The Ångström exponent (slope of τ vs λ, controls blue ↔ red tilt)
 * @param omegaI The single–scattering-albedo multiplier for that wavelength (captures absorption colour)
 * @returns A wavelength‐dependent bulk Mie coefficient (m-1)
 */
function betaMiePlanet(waveLength: number, tauP: number, HP: number, alphaP: number, omegaI: number) {
    const scale = betaEarth * (tauP / tauEarth) * (HEarth / HP);
    return scale * Math.pow(waveLength / 550e-9, -alphaP) * omegaI;
}

/**
 * Computes the Mie scattering coefficients for three wavelengths.
 *
 * @param tauP - Vertical aerosol optical depth at 550 nm for the planet
 * @param HP - Effective aerosol scale-height (km) for the planet
 * @param alphaP - Ångström exponent (slope of τ vs λ, controls blue ↔ red tilt)
 * @param omega_i - Single–scattering-albedo multiplier for that wavelength (captures absorption colour)
 * @param waveLengths - Array of three wavelengths for which to compute coefficients, defaults to photopic vision wavelengths
 * @returns Array of three Mie scattering coefficients corresponding to the input wavelengths
 */
export function computeMieScatteringCoefficients(
    tauP: number,
    HP: number,
    alphaP: number,
    omega_i: number,
    waveLengths: DeepReadonly<[number, number, number]> = PresetBands.PHOTOPIC,
): [number, number, number] {
    return [
        betaMiePlanet(waveLengths[0], tauP, HP, alphaP, omega_i),
        betaMiePlanet(waveLengths[1], tauP, HP, alphaP, omega_i),
        betaMiePlanet(waveLengths[2], tauP, HP, alphaP, omega_i),
    ];
}
