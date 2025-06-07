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

import { type DeepReadonly } from "../../types";

/**
 * Boltzmann constant, J K⁻¹  (CODATA 2019)
 * @see https://en.wikipedia.org/wiki/Boltzmann_constant
 */
const K_B = 1.380_649e-23;

/**
 * Loschmidt constant, m⁻³ at 273 K & 101 325 Pa
 * @see https://en.wikipedia.org/wiki/Loschmidt_constant
 */
const N_S = 2.686_78e25;

export type Gas = "N2" | "O2" | "Ar" | "CO2" | "He" | "Ne" | "H2" | "CH4";

/**
 * @param gas The gas for which to return the refractive index.
 * @returns The refractive index of the gas at standard conditions.
 * @see https://www.engineeringtoolbox.com/refractive-index-d_1264.html
 */
export function getGasRefractiveIndex(gas: Gas): number {
    switch (gas) {
        case "N2":
            return 1.000298;
        case "O2":
            return 1.000271;
        case "Ar":
            return 1.000281;
        case "CO2":
            return 1.00045;
        case "He":
            return 1.000036;
        case "Ne":
            return 1.000067;
        case "H2":
            return 1.000132;
        case "CH4":
            return 1.000444;
        default:
            throw new Error(`Unknown gas: ${String(gas)}`);
    }
}

export function getGasDepolarization(gas: Gas): number {
    switch (gas) {
        case "N2":
            return 0.022;
        case "O2":
            return 0.054;
        case "CO2":
            // King correction is 1.1364 according to https://acp.copernicus.org/articles/21/14927/2021/acp-21-14927-2021.pdf
            // So solving for delta in the King correction formula gives us 0.075
            return 0.075;
        case "Ar":
        case "He":
        case "Ne":
        case "H2":
        case "CH4":
            return 0; // Remaining gases assumed ≈ 0
        default:
            throw new Error(`Unknown gas: ${String(gas)}`);
    }
}

/**
 * Default photopic RGB band-centres (metres)
 */
const RGB_WAVELENGTHS = [680e-9, 550e-9, 440e-9] as const;

/**
 * Compute Rayleigh β_R, β_G, β_B (m⁻¹) for a well-mixed gas atmosphere.
 *
 * @param fractions An array of tuples containing a gas and its associated Mole/volume fraction. The sum of all fractions must add up to 1.0
 * @param pressure Ambient pressure (Pa)
 * @param temperature Ambient temperature (K)
 * @param waveLengths Wavelength array (m). Default: RGB_WAVELENGTHS
 * @returns Tuple [β_R, β_G, β_B] in m⁻¹
 */
export function computeRayleighBetaRGB(
    fractions: DeepReadonly<Array<[Gas, number]>>,
    pressure: number,
    temperature: number,
    waveLengths: DeepReadonly<[number, number, number]> = RGB_WAVELENGTHS,
): [number, number, number] {
    /* --- (1) Mixture refractive index and depolarisation --- */
    let nMinus1 = 0;
    let delta = 0;

    for (const [gas, fraction] of fractions) {
        nMinus1 += fraction * (getGasRefractiveIndex(gas) - 1);
        delta += fraction * getGasDepolarization(gas);
    }
    const n = 1 + nMinus1;
    const F = (6 + 3 * delta) / (6 - 7 * delta); // King correction

    /* --- (2) Molecular number density at (P,T) --- */
    const N = pressure / (K_B * temperature);

    /* --- (3) β(λ) for each wavelength --- */
    return [
        N * computeRayleighCrossSection(waveLengths[0], n, F),
        N * computeRayleighCrossSection(waveLengths[1], n, F),
        N * computeRayleighCrossSection(waveLengths[2], n, F),
    ];
}

/**
 * Computes the Rayleigh scattering cross section for a gas for the given wavelength
 * @param wavelength Wavelength of light (m) Inverse of frequency nu.
 * @param n Refractive index of the gas at standard conditions (dimensionless)
 * @param F King correction factor (dimensionless)
 * @returns Rayleigh scattering cross section (m²)
 * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC6800691/pdf/nihms-1036079.pdf Rayleigh scattering cross sections of argon, carbon dioxide, sulfur hexafluoride, and methane in the UV-A region using Broadband Cavity Enhanced Spectroscopy
 * @see https://acp.copernicus.org/articles/21/14927/2021/ Scattering and absorption cross sections of atmospheric gases in the ultraviolet–visible wavelength range (307–725nm)
 */
function computeRayleighCrossSection(wavelength: number, n: number, F: number): number {
    return ((24 * Math.PI ** 3 * (n ** 2 - 1) ** 2) / (wavelength ** 4 * N_S ** 2)) * (F / (n ** 2 + 2) ** 2);
}
