import { assert, describe, expect, it } from "vitest";

import {
    getRgbFromTemperature,
    integrateBlackBodySpectrum,
    integrateSpectrum,
    normalizeLinearSrgb,
    xyzToLinearSrgb,
} from "./specrend";

describe("stellar spectral colorimetry", () => {
    // Reference: Hollands et al. (2026), Section 2.4, Figure 4:
    // https://academic.oup.com/rasti/article/doi/10.1093/rasti/rzag069/8914458?login=false
    // These are atmospheric spectra, not Planck spectra. Published XYZ/RGB values are rounded.
    it.each([
        { model: "solar atmosphere, 5800 K", xyz: { x: 0.974, y: 1, z: 1.024 }, rgb: [1, 0.878, 0.84] },
        {
            model: "hydrogen white dwarf, 10000 K",
            xyz: { x: 0.96, y: 1, z: 1.496 },
            rgb: [0.58, 0.704, 1],
        },
    ])("reproduces the published $model linear sRGB colour", ({ xyz, rgb }) => {
        const linear = normalizeLinearSrgb(xyzToLinearSrgb(xyz));
        for (const [index, channel] of Object.values(linear).entries()) {
            const expected = rgb[index];
            assert.isDefined(expected);
            expect(Math.abs(channel - expected)).toBeLessThan(0.002);
        }
    });

    // Independent reference: Python float64 SI Planck exitance, composite Simpson quadrature
    // on ALL 471 official CIE 1 nm samples (rather than this implementation's 5 nm trapezoids).
    // https://doi.org/10.25039/CIE.DS.xvudnb9b
    // XYZ reference units: observer-weighted W/m². Relative tolerance 5e-5 covers quadrature.
    it.each([
        {
            temperature: 3000,
            xyz: [150296.5902783758, 138994.32381378743, 54691.47602012367],
            xy: [0.43693106, 0.40407395] as const,
        },
        {
            temperature: 4000,
            xyz: [1174231.8586717695, 1162834.277773056, 749447.2663404369],
            xy: [0.38043958, 0.37674687] as const,
        },
        {
            temperature: 5778,
            xyz: [8284712.29681285, 8520563.646711392, 8574445.707255831],
            xy: [0.32643038, 0.33572329] as const,
        },
        {
            temperature: 6500,
            xyz: [13691481.266005695, 14132654.026820399, 15845228.702196335],
            xy: [0.31352601, 0.32362857] as const,
        },
        {
            temperature: 10000,
            xyz: [59374534.37581995, 60994034.9287025, 91204462.25748344],
            xy: [0.28063376, 0.28828833] as const,
        },
    ])("matches independent Planck integration at $temperature K", ({ temperature, xyz: reference, xy }) => {
        const xyz = integrateBlackBodySpectrum(temperature);

        for (const [index, component] of Object.values(xyz).entries()) {
            const expected = reference[index];
            assert.isDefined(expected);
            expect(Math.abs(component / expected - 1)).toBeLessThan(5e-5);
        }
        const total = xyz.x + xyz.y + xyz.z;
        expect(Math.abs(xyz.x / total - xy[0])).toBeLessThan(1e-5);
        expect(Math.abs(xyz.y / total - xy[1])).toBeLessThan(1e-5);
    });

    it("progresses from orange through near-white to blue without shared temperature state", () => {
        const orange = getRgbFromTemperature(3000);
        const white = getRgbFromTemperature(6500);
        const blue = getRgbFromTemperature(10000);
        expect(orange.r).toBe(1);
        expect(orange.g).toBeGreaterThan(orange.b);
        expect(orange.b).toBeLessThan(0.2);
        expect(Math.min(white.r, white.g, white.b)).toBeGreaterThan(0.9);
        expect(blue.b).toBe(1);
        expect(blue.b).toBeGreaterThan(blue.g);
        expect(blue.g).toBeGreaterThan(blue.r);
        expect(getRgbFromTemperature(3000)).toEqual(orange);
    });

    it("integrates equal energy in SI units and retains absolute spectral amplitude", () => {
        const flat = integrateSpectrum(() => 1);

        // Integral of each official observer curve is approximately 106.86 nm.
        for (const component of Object.values(flat)) {
            expect(component / 1e-9).toBeCloseTo(106.86, 1);
        }
        const doubled = integrateSpectrum(() => 2);

        expect(doubled.x).toBeCloseTo(2 * flat.x, 14);
        expect(doubled.y).toBeCloseTo(2 * flat.y, 14);
        expect(doubled.z).toBeCloseTo(2 * flat.z, 14);
    });

    it("integrates a single 555 nm sample with its explicit 5 nm width", () => {
        const xyz = integrateSpectrum((wavelength) => (Math.abs(wavelength - 555e-9) < 1e-12 ? 1 / 5e-9 : 0));

        // Official CIE 1931 row at 555 nm; yBar is the photopic efficiency peak.
        expect(xyz.x).toBeCloseTo(0.5120501, 7);
        expect(xyz.y).toBeCloseTo(1, 7);
        expect(xyz.z).toBeCloseTo(0.005749999, 9);
    });

    it("includes 360 and 830 nm with trapezoidal endpoint weights", () => {
        const wavelengths: number[] = [];
        const xyz = integrateSpectrum((wavelength) => {
            wavelengths.push(wavelength);
            return wavelength < 361e-9 ? 1 / 5e-9 : 0;
        });

        expect(wavelengths).toHaveLength(95);
        expect(wavelengths[0]).toBeCloseTo(360e-9, 15);
        expect(wavelengths.at(-1)).toBeCloseTo(830e-9, 15);
        expect(xyz.x).toBeCloseTo(0.0001299 / 2, 12);
    });

    it("keeps a zero spectrum and black colour finite", () => {
        const xyz = integrateSpectrum(() => 0);

        expect(xyz).toEqual({ x: 0, y: 0, z: 0 });
        expect(normalizeLinearSrgb(xyzToLinearSrgb(xyz))).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("preserves HDR and out-of-gamut channels in the raw matrix conversion", () => {
        const green = xyzToLinearSrgb({ x: 0, y: 2, z: 0 });
        expect(green.r).toBeLessThan(0);
        expect(green.b).toBeLessThan(0);
        expect(green.g).toBeGreaterThan(1);
        const white = xyzToLinearSrgb({ x: 0.95047, y: 1, z: 1.08883 });
        for (const channel of Object.values(white)) {
            expect(channel).toBeCloseTo(1, 3);
        }
    });

    it("adds only the minimum white once before chromaticity normalization", () => {
        expect(normalizeLinearSrgb({ r: -0.5, g: 0.5, b: 1.5 })).toEqual({ r: 0, g: 0.5, b: 1 });
        expect(normalizeLinearSrgb({ r: 4, g: 2, b: 1 })).toEqual({ r: 1, g: 0.5, b: 0.25 });
        const cold = getRgbFromTemperature(1000);
        expect(cold.b).toBe(0);
        expect(cold.r).toBe(1);
    });

    it.each([100, 1000, 5778, 100000, 1e6, 1e9])("returns finite XYZ and compatibility RGB at %s K", (temperature) => {
        const xyz = integrateBlackBodySpectrum(temperature);

        for (const component of Object.values(xyz)) {
            expect(Number.isFinite(component)).toBe(true);
        }
        for (const channel of Object.values(getRgbFromTemperature(temperature))) {
            expect(Number.isFinite(channel)).toBe(true);
            expect(channel).toBeGreaterThanOrEqual(0);
            expect(channel).toBeLessThanOrEqual(1);
        }
    });
});
