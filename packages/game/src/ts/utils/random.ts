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
 * A useful function to randomly choose an option from a list of options, each option having a weight.
 * @param options An array of tuples, each tuple being an option of type T and its weight. (The weights don't have to add up to 1.0, they are normalized internally.)
 * @param randomValue A random value between 0.0 and 1.0 that you can provide with any random number generator of your choice.
 * @returns The chosen option.
 * @throws An error if the wheel of fortune failed. (This should never happen.)
 */
export function wheelOfFortune<T>(options: [T, number][], randomValue: number): T {
    const total = options.reduce((acc, [, weight]) => acc + weight, 0);
    const choice = randomValue * total;
    let current = 0;
    for (const [option, weight] of options) {
        current += weight;
        if (choice < current) return option;
    }
    throw new Error("Wheel of fortune failed");
}

/**
 * Converts a value drawn from a uniform distribution to an exponential distribution
 * @param uniformValue A number drawn from a uniform distribution
 * @param lambda The lambda parameter of the exponential distribution
 * @see https://en.wikipedia.org/wiki/Exponential_distribution#Random_variate_generation
 */
export function uniformToExponential(uniformValue: number, lambda: number) {
    return -Math.log(uniformValue) / lambda;
}

/**
 * Creates a random vector which sums to 1. This is equivalent to creating a pie chart with a given number of slice: the size of each slice is random but the total is equal to 100%
 * @param nbSlices The number of slices you want in your pie
 * @param rng The noise based random number generator used
 * @param baseIndex The first index to use in the rng
 * @see https://stackoverflow.com/questions/53279807/how-to-get-random-number-list-with-fixed-sum-and-size
 */
export function randomPieChart(nbSlices: number, rng: (index: number) => number, baseIndex: number): number[] {
    const results = [];
    let sum = 0.0;
    for (let i = 0; i < nbSlices; i++) {
        const exponentialComponent = uniformToExponential(rng(baseIndex + i), 1.0);
        results.push(exponentialComponent);
        sum += exponentialComponent;
    }

    return results.map((result) => result / sum);
}

export function pickPseudoRandomItems<T>(
    items: T[],
    nbItemsToPick: number,
    rng: (index: number) => number,
    baseIndex: number,
): T[] {
    const itemsCopy = Array.from(items);
    const results: T[] = [];
    for (let i = 0; i < nbItemsToPick; i++) {
        const randomIndex = Math.floor(rng(baseIndex + i) * itemsCopy.length);
        results.push(...itemsCopy.splice(randomIndex, 1));
    }

    return results;
}
