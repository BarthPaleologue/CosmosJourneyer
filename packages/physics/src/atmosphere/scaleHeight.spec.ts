import { describe, expect, it } from "vitest";

import { computeAtmospherePressureScaleHeight, getHeightForPressure } from "./scaleHeight";

function relativeError(calculated: number, reference: number): number {
    return Math.abs(calculated - reference) / reference;
}

describe("computeAtmospherePressureScaleHeight", () => {
    it.each([
        { world: "Earth", temperature: 288, gravity: 9.81, molarMass: 0.02897, expected: 8.4e3, tolerance: 0.05 },
        { world: "Mars", temperature: 210, gravity: 3.71, molarMass: 0.04334, expected: 11.2e3, tolerance: 0.05 },
        { world: "Titan", temperature: 94, gravity: 1.35, molarMass: 0.028, expected: 17e3, tolerance: 0.22 },
        { world: "Venus", temperature: 737, gravity: 8.87, molarMass: 0.04345, expected: 15.9e3, tolerance: 0.05 },
        { world: "Jupiter", temperature: 165, gravity: 25.92, molarMass: 0.00222, expected: 27e3, tolerance: 0.15 },
    ])("computes $world's scale height", ({ temperature, gravity, molarMass, expected, tolerance }) => {
        const prediction = computeAtmospherePressureScaleHeight(temperature, gravity, molarMass);
        expect(relativeError(prediction, expected)).toBeLessThan(tolerance);
    });
});

describe("getHeightForPressure", () => {
    it("returns the reference height at the reference pressure", () => {
        expect(getHeightForPressure(101_325, { pressure: 101_325, height: 0 }, 8_400)).toBeCloseTo(0);
    });

    it("approximates Earth's Kármán line", () => {
        const height = getHeightForPressure(3.2e-2, { pressure: 101_325, height: 0 }, 8_400);
        expect(height).toBeGreaterThan(100_000);
        expect(Math.abs(height - 100_000)).toBeLessThan(30_000);
    });
});
