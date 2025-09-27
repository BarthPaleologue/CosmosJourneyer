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

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

export function moveTowards(x: number, target: number, rate: number): number {
    if (x > target) {
        return Math.max(target, x - rate);
    }
    return Math.min(target, x + rate);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

export function triangleWave(x: number) {
    return 2 * Math.abs(x - Math.floor(x + 0.5));
}

export function remap(value: number, from1: number, to1: number, from2: number, to2: number) {
    return from2 + ((value - from1) * (to2 - from2)) / (to1 - from1);
}

export function gcd(a: number, b: number): number {
    if (b === 0) {
        return a;
    }
    return gcd(b, a % b);
}

/**
 * Finds the value that minimizes of the given function using the Newton-Raphson method.
 * @param f The function to minimize
 * @param startingPoint The starting point for the search
 * @param maxIterations The maximum number of iterations to perform for the search
 * @returns The value that minimizes the function
 */
export function findMinimumNewtonRaphson(f: (x: number) => number, startingPoint: number, maxIterations = 100) {
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
