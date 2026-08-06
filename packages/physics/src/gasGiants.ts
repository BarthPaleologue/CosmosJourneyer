//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { JupiterMass, JupiterRadius } from "./constants/astrophysics";

/**
 * @param mass The mass of the gas giant in kilograms.
 * @returns An estimate of the radius of the gas giant in meters. Works best for cool gas giants (below 1000 K).
 * @see https://arxiv.org/pdf/1909.09207
 */
export function getCoolGasGiantRadiusFromMass(mass: number): number {
    const c0 = 0.96;
    const c1 = 0.21;
    const c2 = -0.2;

    const logRelativeMass = Math.log10(mass / JupiterMass);
    const radiusInJupiterRadii = c0 + c1 * logRelativeMass + c2 * logRelativeMass ** 2;

    return radiusInJupiterRadii * JupiterRadius;
}
