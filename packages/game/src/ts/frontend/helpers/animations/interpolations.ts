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

export function easeInOutInterpolation(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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

/**
 * Frame-rate independent lerp based on Freya Holmer's tweet.
 * @param a The start value
 * @param b The target value
 * @param halfLifeSeconds The half-life of the lerp (in seconds)
 * @param deltaSeconds The time delta (in seconds)
 * @returns The interpolated value
 * @see https://x.com/FreyaHolmer/status/1757836988495847568
 */
export function lerpSmooth(a: number, b: number, halfLifeSeconds: number, deltaSeconds: number) {
    return b + (a - b) * 2 ** (-deltaSeconds / halfLifeSeconds);
}

/**
 * Linear interpolation for numbers.
 * @param a The start value
 * @param b The target value
 * @param t The interpolation factor (0 to 1)
 * @returns The interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
