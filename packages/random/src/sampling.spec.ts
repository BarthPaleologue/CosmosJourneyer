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

import { describe, expect, it } from "vitest";

import { getRngFromSeed, randomPieChart, uniformToExponential, wheelOfFortune } from "./index";

describe("sampling compatibility", () => {
    it("normalizes weights and uses strict cumulative boundaries", () => {
        const options: [string, number][] = [
            ["zero", 0],
            ["a", 2],
            ["b", 3],
        ];
        expect([0, 0.399999, 0.4, 0.999999].map((value) => wheelOfFortune(options, value))).toEqual([
            "a",
            "a",
            "b",
            "b",
        ]);
        expect(() => wheelOfFortune(options, 1)).toThrow("Wheel of fortune failed");
        expect(() => wheelOfFortune([], 0)).toThrow("Wheel of fortune failed");
    });
    it("preserves the exponential transform and endpoints", () => {
        expect(uniformToExponential(0.25, 2)).toBe(0.6931471805599453);
        expect(uniformToExponential(0, 1)).toBe(Infinity);
        expect(uniformToExponential(1, 1)).toBe(-0);
    });
    it("preserves pie proportions and normalization", () => {
        expect(randomPieChart(4, getRngFromSeed(42), 7)).toEqual([
            0.05161882566513058, 0.756011241457456, 0.05127770133577149, 0.14109223154164188,
        ]);
        for (const seed of [-42, 0, 42]) {
            for (let count = 1; count <= 20; count++) {
                const pie = randomPieChart(count, getRngFromSeed(seed), 7);
                expect(pie).toHaveLength(count);
                expect(pie.every((slice) => slice >= 0 && slice <= 1)).toBe(true);
                expect(pie.reduce((sum, slice) => sum + slice, 0)).toBeCloseTo(1, 14);
            }
        }
        expect(randomPieChart(0, getRngFromSeed(42), 0)).toEqual([]);
        expect(randomPieChart(1, () => 1, 0)).toEqual([NaN]);
    });
});
