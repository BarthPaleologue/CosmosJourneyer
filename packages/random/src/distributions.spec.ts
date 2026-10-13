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

import { afterEach, describe, expect, it, vi } from "vitest";

import { centeredRand, randRange, randRangeInt, normalRandom, uniformRandBool, getRngFromSeed } from "./index";

afterEach(() => vi.restoreAllMocks());
const rng = getRngFromSeed(42);

describe("extended-random@1.2.2 compatibility", () => {
    it("preserves indexed distributions", () => {
        expect(centeredRand(rng, 7)).toBe(0.49113424098637615);
        expect(randRange(-3, 8, rng, 7)).toBe(5.201238325425068);
        expect(randRangeInt(-3, 8, rng, 7)).toBe(5);
        expect(uniformRandBool(0.75, rng, 7)).toBe(true);
    });
    it.each([
        [0, 6.32142004720318],
        [1, 3.6878452395301746],
        [7, 6.527042147915494],
        [-1, 6.086295644430066],
    ])("preserves normalRandom at index %s", (index, expected) => {
        expect(normalRandom(5, 2, rng, index)).toBe(expected);
    });
    it("uses consecutive indices for normalRandom, including index zero", () => {
        const source = vi.fn(rng);
        normalRandom(5, 2, source, 0);
        expect(source.mock.calls).toEqual([[0], [1]]);
    });
    it("preserves non-indexed samples when the index is omitted", () => {
        const source = vi.fn(() => 0.25);
        expect(normalRandom(5, 2, source)).toBe(5 + 2 * Math.sqrt(-2 * Math.log(0.25)) * Math.cos(2 * Math.PI * 0.25));
        expect(source.mock.calls).toEqual([[0], [1]]);
    });
    it("defaults indexed distributions to index zero", () => {
        expect(centeredRand(rng)).toBe(centeredRand(rng, 0));
        expect(randRange(-3, 8, rng)).toBe(randRange(-3, 8, rng, 0));
        expect(randRangeInt(-3, 8, rng)).toBe(randRangeInt(-3, 8, rng, 0));
        expect(uniformRandBool(0.5, rng)).toBe(uniformRandBool(0.5, rng, 0));
        expect(normalRandom(5, 2, rng)).toBe(6.32142004720318);
    });
    it("preserves default Math.random and non-indexed sources", () => {
        const random = vi.spyOn(Math, "random").mockReturnValue(0.25);
        expect(centeredRand()).toBe(-0.5);
        expect(randRange()).toBe(0.25);
        expect(randRangeInt(2, 5)).toBe(3);
        expect(uniformRandBool(0.25)).toBe(false);
        expect(randRange(-3, 8, () => 0.25, 7)).toBe(-0.25);
        expect(random).toHaveBeenCalledTimes(4);
    });
    it("includes both integer endpoints and preserves floating endpoints", () => {
        expect(randRangeInt(-3, 8, () => 0, 0)).toBe(-3);
        expect(randRangeInt(-3, 8, () => 1 - Number.EPSILON, 0)).toBe(8);
        expect(randRangeInt(-3, 8, () => 1, 0)).toBe(9);
        expect(randRange(-3, 8, () => 0, 0)).toBe(-3);
        expect(randRange(-3, 8, () => 1, 0)).toBe(8);
    });
});
