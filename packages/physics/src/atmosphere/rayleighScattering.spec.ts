import { describe, expect, it } from "vitest";

import { computeRayleighBetaRGB } from "./rayleighScattering";

function relativeError(calculated: number, reference: number): number {
    return Math.abs(calculated - reference) / reference;
}

describe("computeRayleighBetaRGB", () => {
    it("computes Earth's coefficients within 5%", () => {
        const prediction = computeRayleighBetaRGB(
            [
                ["N2", 0.78084],
                ["O2", 0.209476],
                ["Ar", 0.00934],
                ["CO2", 0.0004],
            ],
            101_325,
            288.15,
            [680e-9, 550e-9, 440e-9],
        );
        const reference = [4.9e-6, 1.14e-5, 2.79e-5] as const;

        expect(relativeError(prediction[0], reference[0])).toBeLessThan(0.05);
        expect(relativeError(prediction[1], reference[1])).toBeLessThan(0.05);
        expect(relativeError(prediction[2], reference[2])).toBeLessThan(0.05);
    });

    it("computes Mars's coefficients within 7%", () => {
        const prediction = computeRayleighBetaRGB(
            [
                ["CO2", 0.959],
                ["N2", 0.027],
                ["Ar", 0.014],
            ],
            600,
            210,
            [680e-9, 550e-9, 440e-9],
        );
        const reference = [1.06e-7, 2.43e-7, 5.83e-7] as const;

        expect(relativeError(prediction[0], reference[0])).toBeLessThan(0.07);
        expect(relativeError(prediction[1], reference[1])).toBeLessThan(0.07);
        expect(relativeError(prediction[2], reference[2])).toBeLessThan(0.07);
    });

    it("computes Titan's coefficients within 5%", () => {
        const prediction = computeRayleighBetaRGB(
            [
                ["N2", 0.95],
                ["CH4", 0.05],
            ],
            146_700,
            94,
            [680e-9, 550e-9, 440e-9],
        );
        const reference = [2.34e-5, 5.46e-5, 1.33e-4] as const;

        expect(relativeError(prediction[0], reference[0])).toBeLessThan(0.05);
        expect(relativeError(prediction[1], reference[1])).toBeLessThan(0.05);
        expect(relativeError(prediction[2], reference[2])).toBeLessThan(0.05);
    });

    it("computes Jupiter's coefficients within 5%", () => {
        const prediction = computeRayleighBetaRGB(
            [
                ["H2", 0.898],
                ["He", 0.102],
            ],
            100_000,
            273,
            [650e-9, 550e-9, 450e-9],
        );
        const reference = [8.38e-7, 1.629e-6, 3.64e-6] as const;

        expect(relativeError(prediction[0], reference[0])).toBeLessThan(0.05);
        expect(relativeError(prediction[1], reference[1])).toBeLessThan(0.05);
        expect(relativeError(prediction[2], reference[2])).toBeLessThan(0.05);
    });
});
