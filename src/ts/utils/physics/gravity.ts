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
 * Gravitational constant, m³ kg⁻¹ s⁻²
 * @see https://en.wikipedia.org/wiki/Gravitational_constant
 */
export const G = 6.674_30e-11;

/**
 * @param mass The mass of the object (kg)
 * @param distance The distance from the center of the object to the point where the gravitational acceleration is computed (m)
 * @returns The gravitational acceleration at the given distance (m/s²)
 * @see https://en.wikipedia.org/wiki/Newton%27s_law_of_universal_gravitation
 */
export function computeGravityAcceleration(mass: number, distance: number): number {
    return (G * mass) / (distance * distance);
}
