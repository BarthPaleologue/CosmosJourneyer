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

export function easeInOutQuadratic(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/**
 * Frame-rate independent slerp based on frame-rate independent lerp.
 * @param a The start quaternion
 * @param b The target quaternion
 * @param halfLifeSeconds The half-life of the slerp (in seconds)
 * @param deltaSeconds The time delta (in seconds)
 * @param ref The quaternion to store the result in
 * @returns The interpolated quaternion
 */
export function slerpSmoothToRef(
    a: Quaternion,
    b: Quaternion,
    halfLifeSeconds: number,
    deltaSeconds: number,
    ref: Quaternion,
) {
    return Quaternion.SlerpToRef(a, b, 2 ** (-deltaSeconds / halfLifeSeconds), ref);
}
