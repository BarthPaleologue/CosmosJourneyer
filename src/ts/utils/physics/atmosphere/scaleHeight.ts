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

/**
 * Universal gas constant, J/(mol·K)
 */
const R = 8.314462618;

/**
 * @param temperature Temperature in Kelvin
 * @param gravity Gravitational acceleration in m/s²
 * @param meanMolecularWeight Mean molecular weight of the atmosphere in kg/mol
 * @returns The Rayleigh scale height in meters.
 * @see https://en.wikipedia.org/wiki/Scale_height
 */
export function computeAtmospherePressureScaleHeight(
    temperature: number,
    gravity: number,
    meanMolecularWeight: number,
): number {
    // Scale height formula: H = R * T / (M * g)
    return (R * temperature) / (meanMolecularWeight * gravity);
}
