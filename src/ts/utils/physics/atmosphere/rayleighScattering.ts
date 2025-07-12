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

import { type Gas } from "@/backend/universe/orbitalObjects/atmosphereModel";

import { type DeepReadonly } from "@/utils/types";

import { Kb } from "../constants";
import { getGasDepolarization, getGasRefractiveIndex } from "./gas";

/**
 * Loschmidt constant (number density at STP), m⁻³ at 273.15 K & 101 325 Pa.
 * This is the number density of an ideal gas at Standard Temperature and Pressure (STP).
 * @see https://en.wikipedia.org/wiki/Loschmidt_constant
 */
const N_S_STP = 2.686_78e25;

/**
 * Compute Rayleigh β_R, β_G, β_B (m⁻¹) for a well-mixed gas atmosphere.
 *
 * This function calculates the Rayleigh scattering extinction coefficients (beta)
 * for a gas mixture at specified pressure, temperature, and wavelengths.
 * It considers the mixture's effective refractive index and depolarization.
 *
 * @param fractions An array of tuples containing a gas and its associated Mole/volume fraction. The sum of all fractions must add up to 1.0 (will be normalized if not).
 * @param pressure Ambient pressure (Pa)
 * @param temperature Ambient temperature (K)
 * @param waveLengths Wavelength array (m).
 * @returns Tuple [β_R, β_G, β_B] in m⁻¹
 */
export function computeRayleighBetaRGB(
    fractions: DeepReadonly<Array<[Gas, number]>>,
    pressure: number,
    temperature: number,
    waveLengths: DeepReadonly<[number, number, number]>,
): [number, number, number] {
    /* --- (1) Calculate mixture refractive index and depolarization at STP --- */
    let nMinus1 = 0;
    let delta = 0;

    // Normalize fractions in case their sum is not exactly 1.0
    const sumFractions = fractions.map((fraction) => fraction[1]).reduce((acc, fraction) => acc + fraction, 0);

    for (const [gas, fraction] of fractions) {
        // These gas refractive indices and depolarization values are for standard conditions
        nMinus1 += (fraction * (getGasRefractiveIndex(gas) - 1)) / sumFractions;
        delta += (fraction * getGasDepolarization(gas)) / sumFractions;
    }
    const n_mixture_STP = 1 + nMinus1; // Effective refractive index of the mixture at STP
    const F_king = (6 + 3 * delta) / (6 - 7 * delta); // King correction factor for the mixture

    /* --- (2) Calculate actual molecular number density at given (P,T) --- */
    // This is the number of molecules per cubic meter at the specified pressure and temperature.
    const N_actual = pressure / (Kb * temperature);

    /* --- (3) Compute β(λ) for each wavelength --- */
    // β (extinction coefficient) = N_actual * σ_molecular
    // where σ_molecular is the molecular Rayleigh scattering cross-section.
    return [
        N_actual * computeMolecularRayleighCrossSection(waveLengths[0], n_mixture_STP, F_king),
        N_actual * computeMolecularRayleighCrossSection(waveLengths[1], n_mixture_STP, F_king),
        N_actual * computeMolecularRayleighCrossSection(waveLengths[2], n_mixture_STP, F_king),
    ];
}

/**
 * Computes the **molecular Rayleigh scattering cross section** (m²/molecule)
 * for a gas mixture at a given wavelength.
 *
 * This cross-section is derived from the effective refractive index and King factor
 * of the mixture, assuming these properties are defined at Standard Temperature and Pressure (STP).
 *
 * @param wavelength Wavelength of light (m)
 * @param n_mixture_STP Effective refractive index of the gas mixture at STP (dimensionless)
 * @param F_king King correction factor for the gas mixture (dimensionless)
 * @returns Rayleigh scattering molecular cross section (m²)
 * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC6800691/pdf/nihms-1036079.pdf Rayleigh scattering cross sections of argon, carbon dioxide, sulfur hexafluoride, and methane in the UV-A region using Broadband Cavity Enhanced Spectroscopy
 * @see https://acp.copernicus.org/articles/21/14927/2021/ Scattering and absorption cross sections of atmospheric gases in the ultraviolet–visible wavelength range (307–725nm)
 */
function computeMolecularRayleighCrossSection(wavelength: number, n_mixture_STP: number, F_king: number): number {
    const n2_mixture_STP = n_mixture_STP * n_mixture_STP;
    const lambda4 = wavelength ** 4;

    // This term represents the molecular polarizability component squared,
    // derived from the Lorentz-Lorenz relation using the refractive index at STP and Loschmidt constant.
    const polarizabilityTermSquared = ((n2_mixture_STP - 1) / ((n2_mixture_STP + 2) * N_S_STP)) ** 2;

    // The pre-factor for the molecular Rayleigh scattering cross-section formula.
    const preFactor = (24 * Math.PI ** 3) / lambda4;

    return preFactor * polarizabilityTermSquared * F_king;
}
