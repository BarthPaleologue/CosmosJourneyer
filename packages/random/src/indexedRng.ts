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
// Modern variant is SquirrelNoise5 by Squirrel Eiserloh: https://gist.github.com/kevinmoran/0198d8e9de0da7057abe8b8b34d50f86

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

/**
 * SquirrelNoise5 (Squirrel Eiserloh, GDC) as an indexed hash: 32-bit integer
 * mixing via Math.imul and unsigned shifts, returning a value in [0, 1).
 * Unlike the legacy variant, the result never leaves the unit interval.
 * @see https://gist.github.com/kevinmoran/0198d8e9de0da7057abe8b8b34d50f86
 * @param seed Seed mixed into the deterministic noise value.
 * @param index Integer index to hash into a noise value.
 * @returns Deterministic noise in [0, 1).
 */
export function squirrelNoise(seed: number, index: number): number {
    const BIT_NOISE1 = 0xd2a80a3f;
    const BIT_NOISE2 = 0xa884f197;
    const BIT_NOISE3 = 0x6c736f4b;
    const BIT_NOISE4 = 0xb79f3abb;
    const BIT_NOISE5 = 0x1b56c4e9;

    let mangled = Math.imul(index, BIT_NOISE1);
    mangled = (mangled + seed) | 0;
    mangled ^= mangled >>> 9;
    mangled = (mangled + BIT_NOISE2) | 0;
    mangled ^= mangled >>> 11;
    mangled = Math.imul(mangled, BIT_NOISE3);
    mangled ^= mangled >>> 13;
    mangled = (mangled + BIT_NOISE4) | 0;
    mangled ^= mangled >>> 15;
    mangled = Math.imul(mangled, BIT_NOISE5);
    mangled ^= mangled >>> 17;

    return (mangled >>> 0) / 2 ** 32;
}

/**
 * Creates an indexed noise function using the modern squirrel noise algorithm.
 * @param seed Seed shared by all generated indexed values.
 * @returns A deterministic random source in [0, 1) indexed by integer position.
 */
export function seededSquirrelNoise(seed: number): IndexedRng {
    return (index) => squirrelNoise(seed, index);
}
