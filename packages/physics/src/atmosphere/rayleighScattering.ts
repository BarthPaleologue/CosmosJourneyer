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

import { BoltzmannConstant } from "../constants";
import type { WavelengthTriplet } from "./constants";
import type { GasMix } from "./gas";
import { getGasDepolarization, getGasRefractiveIndex } from "./gas";

/** Loschmidt constant in m⁻³ at 273.15 K and 101325 Pa. */
const LoschmidtConstantAtStp = 2.686_78e25;

/**
 * Computes the Rayleigh extinction coefficients in m⁻¹ for a well-mixed gas atmosphere.
 */
export function computeRayleighBetaRGB(
    gasMix: GasMix,
    pressure: number,
    temperature: number,
    wavelengths: WavelengthTriplet,
): [number, number, number] {
    const totalFraction = gasMix.reduce((total, [, fraction]) => total + fraction, 0);

    let refractiveIndexMinusOne = 0;
    let depolarization = 0;
    for (const [gas, fraction] of gasMix) {
        const normalizedFraction = fraction / totalFraction;
        refractiveIndexMinusOne += normalizedFraction * (getGasRefractiveIndex(gas) - 1);
        depolarization += normalizedFraction * getGasDepolarization(gas);
    }

    const refractiveIndex = 1 + refractiveIndexMinusOne;
    const kingCorrection = (6 + 3 * depolarization) / (6 - 7 * depolarization);
    const molecularNumberDensity = pressure / (BoltzmannConstant * temperature);

    const coefficientAt = (wavelength: number): number =>
        molecularNumberDensity * computeMolecularRayleighCrossSection(wavelength, refractiveIndex, kingCorrection);

    return [coefficientAt(wavelengths[0]), coefficientAt(wavelengths[1]), coefficientAt(wavelengths[2])];
}

/** Computes the molecular Rayleigh scattering cross section in m²/molecule. */
function computeMolecularRayleighCrossSection(
    wavelength: number,
    refractiveIndexAtStp: number,
    kingCorrection: number,
): number {
    const refractiveIndexSquared = refractiveIndexAtStp ** 2;
    const polarizabilityTermSquared =
        ((refractiveIndexSquared - 1) / ((refractiveIndexSquared + 2) * LoschmidtConstantAtStp)) ** 2;
    return ((24 * Math.PI ** 3) / wavelength ** 4) * polarizabilityTermSquared * kingCorrection;
}
