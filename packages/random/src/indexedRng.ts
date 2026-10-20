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

// Adapted from squirrel-noise@1.0.0 by Barthélemy Paléologue.

export type IndexedRng = (index: number) => number;

/**
 * Returns the same indexed noise as squirrel-noise@1.0.0.
 * @param seed Seed mixed into the deterministic noise value.
 * @param index Integer index to hash into a noise value.
 * @returns Deterministic noise in the same range as the legacy implementation.
 */
export function legacySquirrelNoise(seed: number, index: number): number {
    const BIT_NOISE1 = 0x68e31da4;
    const BIT_NOISE2 = 0xb5297a4d;
    const BIT_NOISE3 = 0x1b56c4e9;

    // Keep JS floating-point multiplication and signed shifts: imul/unsigned shifts change existing worlds.
    let mangledBits = index;
    mangledBits *= BIT_NOISE1;
    mangledBits += seed;
    mangledBits ^= mangledBits >> 8;
    mangledBits += BIT_NOISE2;
    mangledBits ^= mangledBits << 8;
    mangledBits *= BIT_NOISE3;
    mangledBits ^= mangledBits >> 8;

    return mangledBits / (2 ** 31 - 1);
}

/**
 * Creates an indexed noise function using the legacy squirrel-noise algorithm.
 * @param seed Seed shared by all generated indexed values.
 * @returns A deterministic random source indexed by integer position.
 */
export function seededLegacySquirrelNoise(seed: number): IndexedRng {
    return (index) => legacySquirrelNoise(seed, index);
}

/**
 * Creates the default indexed random source for a seed.
 * @param seed Seed shared by all generated indexed values.
 * @returns A deterministic random source indexed by integer position.
 */
export function getRngFromSeed(seed: number): IndexedRng {
    return seededLegacySquirrelNoise(seed);
}
