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

// Adapted from the installed extended-random@1.2.2 by Barthélemy Paléologue.

import type { IndexedRng } from "./indexedRng";

const defaultRand = (): number => Math.random();

/**
 * Returns a random value between -1 and 1
 * @param rand the rng (should return numbers between 0 and 1) defaults to Math.random
 * @param step the step to use for the rng
 */
export function centeredRand(rand: IndexedRng = defaultRand, step = 0): number {
    return (rand(step) - 0.5) * 2;
}

/**
 * Returns a random integer between min and max (both included for a source in [0, 1))
 * @param min the minimum value
 * @param max the maximum value
 * @param rand the rng (should return numbers between 0 and 1) defaults to Math.random
 * @param step the step to use for the rng
 */
export function randRangeInt(min: number, max: number, rand: IndexedRng = defaultRand, step = 0): number {
    return Math.floor(rand(step) * (max - min + 1)) + min;
}

/**
 * Returns a random number between min and max (excluded)
 * @param min the minimum value
 * @param max the maximum value
 * @param rand the rng (should return numbers between 0 and 1) defaults to Math.random
 * @param step the step to use for the rng
 */
export function randRange(min = 0, max = 1, rand: IndexedRng = defaultRand, step = 0): number {
    return rand(step) * (max - min) + min;
}

/**
 * Returns a random number using the normal distribution of the given mean and std using the Box-Mueller transform
 * @param mean The mean value of the distribution
 * @param std The standard deviation to the mean value
 * @param rand the rng (should return numbers between 0 and 1) defaults to Math.random
 * @param step the step to use for the rng (will also use step + 1 !!!)
 * @see https://www.baeldung.com/cs/uniform-to-normal-distribution
 */
export function normalRandom(mean: number, std: number, rand: IndexedRng = defaultRand, step = 0): number {
    return mean + std * Math.sqrt(-2 * Math.log(rand(step))) * Math.cos(2 * Math.PI * rand(step + 1));
}

/**
 * Returns whereas a random number from the uniform distribution between 0 and 1 is lesser than p
 * @param p The probability of the function returning true
 * @param rand the rng (should return numbers between 0 and 1) defaults to Math.random
 * @param step the step to use for the rng
 */
export function uniformRandBool(p: number, rand: IndexedRng = defaultRand, step = 0): boolean {
    return rand(step) < p;
}

/** Converts a uniformly drawn value using the existing inverse exponential transform. */
export function uniformToExponential(uniformValue: number, lambda: number): number {
    return -Math.log(uniformValue) / lambda;
}
