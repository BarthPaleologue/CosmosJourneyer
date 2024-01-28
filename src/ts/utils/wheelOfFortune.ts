//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

/**
 * A useful function to randomly choose an option from a list of options, each option having a weight.
 * @param options An array of tuples, each tuple being an option of type T and its weight. (The weights don't have to add up to 1.0, they are normalized internally.)
 * @param randomValue A random value between 0.0 and 1.0 that you can provide with any random number generator of your choice.
 * @returns The chosen option.
 * @throws An error if the wheel of fortune failed. (This should never happen.)
 */
export function wheelOfFortune<T>(options: [T, number][], randomValue: number): T {
    const total = options.reduce((acc, [_, weight]) => acc + weight, 0);
    const choice = randomValue * total;
    let current = 0;
    for (const [option, weight] of options) {
        current += weight;
        if (choice < current) return option;
    }
    throw new Error("Wheel of fortune failed");
}