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

import { Quaternion } from "@babylonjs/core/Maths/math.vector";

/**
 * @param t - Normalized interpolation progress.
 * @returns Quadratically eased progress.
 */
export function easeInOutQuadratic(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * @param t - Normalized interpolation progress.
 * @returns Cubically eased progress.
 */
export function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/**
 * @param a - First quaternion.
 * @param b - Second quaternion.
 * @param halfLifeSeconds - Exponential weight half-life in seconds.
 * @param deltaSeconds - Elapsed time in seconds.
 * @param ref - Destination quaternion.
 * @returns Interpolated quaternion written to ref.
 */
export function slerpSmoothToRef(
    a: Quaternion,
    b: Quaternion,
    halfLifeSeconds: number,
    deltaSeconds: number,
    ref: Quaternion,
): Quaternion {
    return Quaternion.SlerpToRef(a, b, 2 ** (-deltaSeconds / halfLifeSeconds), ref);
}
