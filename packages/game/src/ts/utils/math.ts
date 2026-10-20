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
 * @param value - Scalar to constrain.
 * @param min - Lower bound.
 * @param max - Upper bound.
 * @returns The bounded scalar.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Moves a scalar toward its target without overshooting.
 * @param x - Current scalar value.
 * @param target - Desired scalar value.
 * @param rate - Maximum nonnegative change for this call.
 * @returns The next value, at most rate away from the current value.
 */
export function moveTowards(x: number, target: number, rate: number): number {
    if (x > target) {
        return Math.max(target, x - rate);
    }
    return Math.min(target, x + rate);
}

/**
 * @param edge0 - Input value at which the transition is zero.
 * @param edge1 - Input value at which the transition is one.
 * @param x - Input value to evaluate.
 * @returns Smooth progress between zero and one.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

/**
 * @param x - Wave phase in cycles.
 * @returns Wave amplitude between zero and one.
 */
export function triangleWave(x: number): number {
    return 2 * Math.abs(x - Math.floor(x + 0.5));
}

/**
 * @param value - Input scalar.
 * @param from1 - First endpoint of the input interval.
 * @param to1 - Second endpoint of the input interval.
 * @param from2 - Output endpoint corresponding to from1.
 * @param to2 - Output endpoint corresponding to to1.
 * @returns The mapped scalar, extrapolated when outside the input interval.
 */
export function remap(value: number, from1: number, to1: number, from2: number, to2: number): number {
    return from2 + ((value - from1) * (to2 - from2)) / (to1 - from1);
}

/**
 * @param a - First nonnegative integer.
 * @param b - Second nonnegative integer.
 * @returns The greatest common divisor.
 */
export function gcd(a: number, b: number): number {
    if (b === 0) {
        return a;
    }
    return gcd(b, a % b);
}

/**
 * Approximates a zero of a scalar function using a finite-difference Newton step.
 * @param f - Function whose zero is sought.
 * @param startingPoint - Initial estimate for the root.
 * @param maxIterations - Maximum number of Newton steps.
 * @returns The final root estimate, without a convergence guarantee.
 */
export function findMinimumNewtonRaphson(f: (x: number) => number, startingPoint: number, maxIterations = 100): number {
    const delta = 1e-4;
    const tolerance = 1e-8;

    let x = startingPoint;
    for (let i = 0; i < maxIterations; i++) {
        const fx = f(x);
        if (Math.abs(fx) < tolerance) {
            break;
        }

        const derivative = (f(x + delta) - fx) / delta;
        const step = fx / derivative;
        x -= step;
    }

    return x;
}

/**
 * Linear interpolation for numbers.
 * @param a - The start value
 * @param b - The target value
 * @param t - The interpolation factor (0 to 1)
 * @returns The interpolated value.
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * @param value - Scalar to wrap.
 * @param modulus - Positive wrap period.
 * @returns The nonnegative remainder below the modulus.
 */
export function mod(value: number, modulus: number): number {
    return ((value % modulus) + modulus) % modulus;
}

export const Tau = 2 * Math.PI;

/**
 * Interpolates angles along their shortest signed angular difference.
 * @param a - Starting angle in radians.
 * @param b - Target angle in radians.
 * @param t - Interpolation factor, normally between zero and one.
 * @returns The interpolated angle in radians without normalizing the final value.
 */
export function lerpAngle(a: number, b: number, t: number): number {
    const shortestAngleDelta = mod(b - a + Math.PI, Tau) - Math.PI;
    return a + shortestAngleDelta * t;
}

/**
 * Frame-rate independent lerp based on Freya Holmer's tweet.
 * @param a - The start value
 * @param b - The target value
 * @param halfLifeSeconds - The half-life of the lerp (in seconds)
 * @param deltaSeconds - The time delta (in seconds)
 * @returns The interpolated value.
 */
export function lerpSmooth(a: number, b: number, halfLifeSeconds: number, deltaSeconds: number): number {
    return b + (a - b) * 2 ** (-deltaSeconds / halfLifeSeconds);
}
