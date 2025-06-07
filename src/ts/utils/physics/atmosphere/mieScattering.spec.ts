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

import { computeMieScatteringCoefficients } from "./mieScattering";

/**
 * Utility: relative error against reference value
 */
const relErr = (calc: number, ref: number) => Math.abs(calc - ref) / ref;

describe("computeMieScatteringCoefficients", () => {
    it("Earth baseline (MODIS climatology)", () => {
        const prediction = computeMieScatteringCoefficients(0.15, 2.0, 1.2, 1.0);
        const expected: [number, number, number] = [5.82e-5, 7.5e-5, 9.8e-5];

        expect(relErr(prediction[0], expected[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], expected[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], expected[2])).toBeLessThan(0.05);
    });

    it("Mars clear-sky background dust", () => {
        const prediction = computeMieScatteringCoefficients(0.2, 12.0, 0.3, 0.97);
        const expected: [number, number, number] = [1.52e-5, 1.62e-5, 1.73e-5];

        expect(relErr(prediction[0], expected[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], expected[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], expected[2])).toBeLessThan(0.05);
    });

    it("Mars regional dust storm (τ≈2)", () => {
        const prediction = computeMieScatteringCoefficients(2.0, 12.0, 0.3, 0.97);
        const expected: [number, number, number] = [1.52e-4, 1.62e-4, 1.73e-4];

        expect(relErr(prediction[0], expected[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], expected[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], expected[2])).toBeLessThan(0.05);
    });

    it("Titan global haze", () => {
        const prediction = computeMieScatteringCoefficients(3.0, 50.0, 0.0, 0.8);
        const expected: [number, number, number] = [4.8e-5, 4.8e-5, 4.8e-5];

        expect(relErr(prediction[0], expected[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], expected[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], expected[2])).toBeLessThan(0.05);
    });
});
