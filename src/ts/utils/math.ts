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

/**
 * Frame-rate independent lerp based on Freya Holmer's tweet.
 * @param a The start value
 * @param b The target value
 * @param halfLife The half-life of the lerp (in seconds)
 * @param deltaSeconds The time delta (in seconds)
 * @returns The interpolated value
 * @see https://x.com/FreyaHolmer/status/1757836988495847568
 */
export function lerpSmooth(a: number, b: number, halfLife: number, deltaSeconds: number) {
    return b + (a - b) * 2 ** (-deltaSeconds / halfLife);
}

export function gcd(a: number, b: number): number {
    if (b === 0) {
        return a;
    }
    return gcd(b, a % b);
}
