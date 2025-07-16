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

import { PresetBands } from "../constants";
import { betaFromAerosolOpticalDepth, computeSpectralMie, getAerosolScaleHeight } from "./mieScattering";
import { computeAtmospherePressureScaleHeight } from "./scaleHeight";

// Earth constants
const MOLAR_MASS_AIR = 0.02897; // kg·mol⁻¹
const T_EARTH = 288.15; // K
const G_EARTH = 9.80665; // m·s⁻²

/**
 * clear‑sky τ₅₅₀
 * @see https://ramanathan.ucsd.edu/wp-content/uploads/sites/460/2017/10/pr87.pdf abstract
 */
const TAU_EARTH = 0.05;
const F_SETTLE_E = 0.15; // settling fraction for continental aerosol
const R_EFF_E = 0.5e-6; // 0.5µm sulphate aerosol

// Mars constants (moderate dusty sol)
const G_MARS = 3.711; // m·s⁻²
const T_MARS = 210; // K
const MM_CO2 = 0.04401; // kg·mol⁻¹

/**
 * τ₅₅₀
 * @see https://ntrs.nasa.gov/api/citations/20150008268/downloads/20150008268.pdf (4.1. Seasonal variations of optical depth)
 */
const TAU_MARS = 0.5;
const F_SETTLE_M = 1.0; // well‑mixed dust column
const R_DUST = 1.0e-6; // 1µm effective radius
const ALPHA_M = 0.6; // Ångström exponent

describe("getAerosolScaleHeight", () => {
    it("≈1.2km for f=0.15", () => {
        expect(getAerosolScaleHeight(8.4e3, 0.15)).toBeCloseTo(1.26e3, -1);
    });
});

describe("betaFromAerosolOpticalDepth", () => {
    it("returns ~3x10⁻⁵ m⁻¹ for Earth clear sky", () => {
        const beta = betaFromAerosolOpticalDepth(TAU_EARTH, 1.26e3);
        expect(beta).toBeGreaterThan(2e-5);
        expect(beta).toBeLessThan(4e-5);
    });
});

describe("computeSpectralMie Earth baseline (α≈0)", () => {
    const res = computeSpectralMie(
        {
            tau550: TAU_EARTH,
            settlingCoefficient: F_SETTLE_E,
            particleRadius: R_EFF_E,
            angstromExponent: 0.0,
        },
        computeAtmospherePressureScaleHeight(T_EARTH, G_EARTH, MOLAR_MASS_AIR),
        PresetBands.PHOTOPIC,
    );

    it("produces nearly equal β across RGB", () => {
        const [r, g, b] = res.betaRGB;
        expect(Math.abs(r - g) / g).toBeLessThan(0.05);
        expect(Math.abs(b - g) / g).toBeLessThan(0.05);
    });

    it("returns monotonically increasing g (blue > red)", () => {
        const [r, g, b] = res.gRGB;
        expect(r).toBeLessThan(g);
        expect(g).toBeLessThan(b);
    });
});

describe("computeSpectralMie Mars dusty sol (α=0.6)", () => {
    const mars = computeSpectralMie(
        {
            tau550: TAU_MARS,
            settlingCoefficient: F_SETTLE_M,
            particleRadius: R_DUST,
            angstromExponent: ALPHA_M,
        },
        computeAtmospherePressureScaleHeight(T_MARS, G_MARS, MM_CO2),
        PresetBands.PHOTOPIC,
    );

    it("β_M within 3–6×10⁻⁵ m⁻¹ for τ=0.5", () => {
        expect(mars.betaRGB[1]).toBeGreaterThan(3e-5); // use G channel
        expect(mars.betaRGB[1]).toBeLessThan(6e-5);
    });

    it("scatters blue more than red (β_B > β_R by ≥20 %)", () => {
        const [r, , b] = mars.betaRGB;
        expect(b).toBeGreaterThan(r * 1.2);
    });
});
