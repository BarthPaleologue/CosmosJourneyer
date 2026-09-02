//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { PresetBands } from "./constants";
import { betaFromAerosolOpticalDepth, computeSpectralMie, getAerosolScaleHeight } from "./mieScattering";
import { computeAtmospherePressureScaleHeight } from "./scaleHeight";

describe("Mie scattering", () => {
    it("derives Earth's aerosol scale height and clear-sky coefficient", () => {
        const height = getAerosolScaleHeight(8.4e3, 0.15);
        expect(height).toBeCloseTo(1.26e3, -1);
        expect(betaFromAerosolOpticalDepth(0.05, height)).toBeGreaterThan(2e-5);
        expect(betaFromAerosolOpticalDepth(0.05, height)).toBeLessThan(4e-5);
    });

    it("produces a flat Earth spectrum and wavelength-dependent asymmetry", () => {
        const result = computeSpectralMie(
            { tau550: 0.05, settlingCoefficient: 0.15, particleRadius: 0.5e-6, angstromExponent: 0 },
            computeAtmospherePressureScaleHeight(288.15, 9.80665, 0.02897),
            PresetBands.PHOTOPIC,
        );
        expect(result.betaRGB[0]).toBeCloseTo(result.betaRGB[1]);
        expect(result.betaRGB[1]).toBeCloseTo(result.betaRGB[2]);
        expect(result.gRGB[0]).toBeLessThan(result.gRGB[1]);
        expect(result.gRGB[1]).toBeLessThan(result.gRGB[2]);
    });

    it("makes dusty Mars scatter blue more strongly than red", () => {
        const result = computeSpectralMie(
            { tau550: 0.5, settlingCoefficient: 1, particleRadius: 1e-6, angstromExponent: 0.6 },
            computeAtmospherePressureScaleHeight(210, 3.711, 0.04401),
            PresetBands.PHOTOPIC,
        );
        expect(result.betaRGB[2]).toBeGreaterThan(result.betaRGB[0] * 1.2);
    });
});
