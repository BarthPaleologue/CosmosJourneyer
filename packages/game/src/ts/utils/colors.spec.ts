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

import { hsvToRgb } from "./colors";
import type { HSVColor } from "./colors";

describe("color utilities", () => {
    describe("hsvToRgb", () => {
        it("should convert pure red correctly", () => {
            const hsv: HSVColor = { h: 0, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(1, 5);
            expect(rgb.g).toBeCloseTo(0, 5);
            expect(rgb.b).toBeCloseTo(0, 5);
        });

        it("should convert pure green correctly", () => {
            const hsv: HSVColor = { h: 120, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(0, 5);
            expect(rgb.g).toBeCloseTo(1, 5);
            expect(rgb.b).toBeCloseTo(0, 5);
        });

        it("should convert pure blue correctly", () => {
            const hsv: HSVColor = { h: 240, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(0, 5);
            expect(rgb.g).toBeCloseTo(0, 5);
            expect(rgb.b).toBeCloseTo(1, 5);
        });

        it("should convert pure cyan correctly", () => {
            const hsv: HSVColor = { h: 180, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(0, 5);
            expect(rgb.g).toBeCloseTo(1, 5);
            expect(rgb.b).toBeCloseTo(1, 5);
        });

        it("should convert pure magenta correctly", () => {
            const hsv: HSVColor = { h: 300, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(1, 5);
            expect(rgb.g).toBeCloseTo(0, 5);
            expect(rgb.b).toBeCloseTo(1, 5);
        });

        it("should convert pure yellow correctly", () => {
            const hsv: HSVColor = { h: 60, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(1, 5);
            expect(rgb.g).toBeCloseTo(1, 5);
            expect(rgb.b).toBeCloseTo(0, 5);
        });

        it("should convert white correctly", () => {
            const hsv: HSVColor = { h: 0, s: 0, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(1, 5);
            expect(rgb.g).toBeCloseTo(1, 5);
            expect(rgb.b).toBeCloseTo(1, 5);
        });

        it("should convert black correctly", () => {
            const hsv: HSVColor = { h: 0, s: 0, v: 0 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(0, 5);
            expect(rgb.g).toBeCloseTo(0, 5);
            expect(rgb.b).toBeCloseTo(0, 5);
        });

        it("should convert gray correctly", () => {
            const hsv: HSVColor = { h: 0, s: 0, v: 0.5 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(0.5, 5);
            expect(rgb.g).toBeCloseTo(0.5, 5);
            expect(rgb.b).toBeCloseTo(0.5, 5);
        });

        it("should handle zero saturation with any hue", () => {
            const hsv: HSVColor = { h: 180, s: 0, v: 0.7 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(0.7, 5);
            expect(rgb.g).toBeCloseTo(0.7, 5);
            expect(rgb.b).toBeCloseTo(0.7, 5);
        });

        it("should handle zero value with any hue and saturation", () => {
            const hsv: HSVColor = { h: 45, s: 0.8, v: 0 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(0, 5);
            expect(rgb.g).toBeCloseTo(0, 5);
            expect(rgb.b).toBeCloseTo(0, 5);
        });

        it("should handle intermediate values correctly", () => {
            // Test a known HSV to RGB conversion
            const hsv: HSVColor = { h: 30, s: 0.6, v: 0.8 };
            const rgb = hsvToRgb(hsv);

            // Expected RGB values for HSV(30, 0.6, 0.8)
            // c = 0.8 * 0.6 = 0.48, x = 0.24, m = 0.32
            // Final: (0.8, 0.56, 0.32)
            expect(rgb.r).toBeCloseTo(0.8, 5);
            expect(rgb.g).toBeCloseTo(0.56, 5);
            expect(rgb.b).toBeCloseTo(0.32, 5);
        });

        it("should handle hue values greater than 360", () => {
            const hsv1: HSVColor = { h: 0, s: 1, v: 1 };
            const hsv2: HSVColor = { h: 360, s: 1, v: 1 };
            const hsv3: HSVColor = { h: 720, s: 1, v: 1 };

            const rgb1 = hsvToRgb(hsv1);
            const rgb2 = hsvToRgb(hsv2);
            const rgb3 = hsvToRgb(hsv3);

            // All should produce the same red color
            expect(rgb1.r).toBeCloseTo(rgb2.r, 5);
            expect(rgb1.g).toBeCloseTo(rgb2.g, 5);
            expect(rgb1.b).toBeCloseTo(rgb2.b, 5);

            expect(rgb1.r).toBeCloseTo(rgb3.r, 5);
            expect(rgb1.g).toBeCloseTo(rgb3.g, 5);
            expect(rgb1.b).toBeCloseTo(rgb3.b, 5);
        });

        it("should handle negative hue values", () => {
            const hsv1: HSVColor = { h: 300, s: 1, v: 1 };
            const hsv2: HSVColor = { h: -60, s: 1, v: 1 };

            const rgb1 = hsvToRgb(hsv1);
            const rgb2 = hsvToRgb(hsv2);

            // Should produce the same magenta color
            expect(rgb1.r).toBeCloseTo(rgb2.r, 5);
            expect(rgb1.g).toBeCloseTo(rgb2.g, 5);
            expect(rgb1.b).toBeCloseTo(rgb2.b, 5);
        });

        it("should handle edge case at hue boundaries", () => {
            // Test at exact boundary between red and yellow (60 degrees)
            const hsv: HSVColor = { h: 60, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            expect(rgb.r).toBeCloseTo(1, 5);
            expect(rgb.g).toBeCloseTo(1, 5);
            expect(rgb.b).toBeCloseTo(0, 5);
        });

        it("should handle fractional hue values", () => {
            const hsv: HSVColor = { h: 45.5, s: 1, v: 1 };
            const rgb = hsvToRgb(hsv);

            // Should be between red and yellow
            expect(rgb.r).toBeCloseTo(1, 5);
            expect(rgb.g).toBeGreaterThan(0.7);
            expect(rgb.g).toBeLessThan(1);
            expect(rgb.b).toBeCloseTo(0, 5);
        });

        it("should produce values in valid RGB range", () => {
            // Test with various random-ish values
            const testCases: HSVColor[] = [
                { h: 123.45, s: 0.67, v: 0.89 },
                { h: 234.56, s: 0.34, v: 0.12 },
                { h: 345.67, s: 0.91, v: 0.56 },
                { h: 78.91, s: 0.23, v: 0.78 },
            ];

            testCases.forEach((hsv) => {
                const rgb = hsvToRgb(hsv);

                expect(rgb.r).toBeGreaterThanOrEqual(0);
                expect(rgb.r).toBeLessThanOrEqual(1);
                expect(rgb.g).toBeGreaterThanOrEqual(0);
                expect(rgb.g).toBeLessThanOrEqual(1);
                expect(rgb.b).toBeGreaterThanOrEqual(0);
                expect(rgb.b).toBeLessThanOrEqual(1);
            });
        });

        it("should handle extreme saturation and value combinations", () => {
            const testCases: HSVColor[] = [
                { h: 180, s: 0.001, v: 0.999 }, // Very low saturation, high value
                { h: 180, s: 0.999, v: 0.001 }, // Very high saturation, low value
                { h: 180, s: 1, v: 1 }, // Maximum saturation and value
                { h: 180, s: 0, v: 0 }, // Minimum saturation and value
            ];

            testCases.forEach((hsv) => {
                const rgb = hsvToRgb(hsv);

                expect(isNaN(rgb.r)).toBe(false);
                expect(isNaN(rgb.g)).toBe(false);
                expect(isNaN(rgb.b)).toBe(false);

                expect(rgb.r).toBeGreaterThanOrEqual(0);
                expect(rgb.r).toBeLessThanOrEqual(1);
                expect(rgb.g).toBeGreaterThanOrEqual(0);
                expect(rgb.g).toBeLessThanOrEqual(1);
                expect(rgb.b).toBeGreaterThanOrEqual(0);
                expect(rgb.b).toBeLessThanOrEqual(1);
            });
        });
    });
});
