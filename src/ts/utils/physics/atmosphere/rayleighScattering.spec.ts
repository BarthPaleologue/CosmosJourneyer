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
        const prediction = computeRayleighBetaRGB(earthAtmosphereComposition, 101_325, 288.15);
        const groundTruth = [4.9e-6, 1.14e-5, 2.79e-5] as const;

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
        const prediction = computeRayleighBetaRGB(marsAtmosphereComposition, 600, 210);
        const groundTruth = [8.7e-8, 2.04e-7, 4.98e-7] as const;

        expect(relErr(prediction[0], groundTruth[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], groundTruth[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], groundTruth[2])).toBeLessThan(0.05);
    });

    it("should compute Titan's rayleigh beta scattering coefficients within 5 %", () => {
        const titanAtmosphereComposition = [
            ["N2", 0.95], // Cassini/Huygens shows 94–98 % N₂
            ["CH4", 0.05], // and 1–5 % CH₄; trace H₂ neglected
        ] as const;
        const prediction = computeRayleighBetaRGB(titanAtmosphereComposition, 146_700, 94);
        const groundTruth = [2.34e-5, 5.46e-5, 1.33e-4] as const;

        expect(relErr(prediction[0], groundTruth[0])).toBeLessThan(0.05);
        expect(relErr(prediction[1], groundTruth[1])).toBeLessThan(0.05);
        expect(relErr(prediction[2], groundTruth[2])).toBeLessThan(0.05);
    });
});
