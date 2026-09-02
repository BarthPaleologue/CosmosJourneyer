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

const UniversalGasConstant = 8.314_462_618;

/**
 * Computes the pressure scale height of an isothermal atmosphere.
 * @param temperature Atmospheric temperature in kelvins.
 * @param gravity Gravitational acceleration in m/s².
 * @param meanMolecularWeight Mean molar mass in kg/mol.
 * @returns Pressure scale height in metres.
 */
export function computeAtmospherePressureScaleHeight(
    temperature: number,
    gravity: number,
    meanMolecularWeight: number,
): number {
    return (UniversalGasConstant * temperature) / (meanMolecularWeight * gravity);
}

/**
 * Computes the height at which a target pressure is reached.
 * @param targetPressure Target atmospheric pressure in pascals.
 * @param reference Known pressure in pascals at a height in metres.
 * @param scaleHeight Pressure scale height in metres.
 * @returns Height in metres relative to the same datum as the reference.
 */
export function getHeightForPressure(
    targetPressure: number,
    reference: Readonly<{ pressure: number; height: number }>,
    scaleHeight: number,
): number {
    return reference.height - scaleHeight * Math.log(targetPressure / reference.pressure);
}
