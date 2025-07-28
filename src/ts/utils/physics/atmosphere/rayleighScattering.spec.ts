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

import { computeRayleighBetaRGB } from "./rayleighScattering";

const relErr = (calc: number, ref: number) => Math.abs(calc - ref) / ref;

describe("computeRayleighBetaRGB", () => {
    it("should compute Earth's rayleigh beta scattering coefficients within 5 %", () => {
        const earthAtmosphereComposition = [
            ["N2", 0.78084],
            ["O2", 0.209476],
            ["Ar", 0.00934],
            ["CO2", 0.0004],
        ] as const;
        const prediction = computeRayleighBetaRGB(
            earthAtmosphereComposition,
            101_325,
            288.15,
            [680e-9, 550e-9, 440e-9],
        );
        const groundTruth = [4.9e-6, 1.14e-5, 2.79e-5] as const; // Bodhaine-Penndorf tables (101 325 Pa, 288 K)

        expect(relErr(prediction[0], groundTruth[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], groundTruth[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], groundTruth[2])).toBeLessThan(0.05);
    });

    it("should compute Mars's rayleigh beta scattering coefficients within 5 %", () => {
        const marsAtmosphereComposition = [
            ["CO2", 0.959],
            ["N2", 0.027],
            ["Ar", 0.014],
        ] as const;
        const prediction = computeRayleighBetaRGB(marsAtmosphereComposition, 600, 210, [680e-9, 550e-9, 440e-9]);
        const groundTruth = [1.06e-7, 2.43e-7, 5.83e-7] as const; // He et al. 2021

        expect(relErr(prediction[0], groundTruth[0])).toBeLessThan(0.07);
        expect(relErr(prediction[1], groundTruth[1])).toBeLessThan(0.07);
        expect(relErr(prediction[2], groundTruth[2])).toBeLessThan(0.07);
    });

    it("should compute Titan's rayleigh beta scattering coefficients within 5 %", () => {
        const titanAtmosphereComposition = [
            ["N2", 0.95], // Cassini/Huygens shows 94–98 % N₂
            ["CH4", 0.05], // and 1–5 % CH₄; trace H₂ neglected
        ] as const;
        const prediction = computeRayleighBetaRGB(titanAtmosphereComposition, 146_700, 94, [680e-9, 550e-9, 440e-9]);
        const groundTruth = [2.34e-5, 5.46e-5, 1.33e-4] as const; // Cassini/HASI

        expect(relErr(prediction[0], groundTruth[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], groundTruth[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], groundTruth[2])).toBeLessThan(0.05);
    });
    it("should compute Jupiter's rayleigh beta scattering coefficients within 5 %", () => {
        const jupiterAtmosphereComposition = [
            ["H2", 0.898],
            ["He", 0.102],
        ] as const;
        const prediction = computeRayleighBetaRGB(jupiterAtmosphereComposition, 100_000, 273, [650e-9, 550e-9, 450e-9]);
        const groundTruth = [8.38e-7, 1.629e-6, 3.64e-6] as const;

        expect(relErr(prediction[0], groundTruth[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], groundTruth[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], groundTruth[2])).toBeLessThan(0.05);
    });
});
