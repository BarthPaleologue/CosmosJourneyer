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

import { type DeepReadonly } from "@/utils/types";

/**
 * @param pressureScaleHeight The pressure scale height in meters.
 * @param settlingCoefficient The settling coefficient between 0 and 1, where 0 means no settling and 1 means complete settling. For Earth, this is typically around 0.15.
 * @returns The aerosol scale height based on the pressure scale height and the settling coefficient.
 */
export function getAerosolScaleHeight(pressureScaleHeight: number, settlingCoefficient: number): number {
    return pressureScaleHeight * settlingCoefficient;
}

/**
 * @param tau550 The aerosol optical depth at 550 nm (dimensionless).
 * @param aerosolScaleHeight The aerosol scale height in meters.
 * @returns The aerosol scattering coefficient in m⁻¹ at 550 nm.
 */
export function betaFromAerosolOpticalDepth(tau550: number, aerosolScaleHeight: number): number {
    return tau550 / aerosolScaleHeight;
}

/* Cornette–Shanks or HG g(λ) approximation from size parameter x = 2πr/λ.  Very
   coarse fit (Moosmüller 2017 inspired): returns 0→0.9 over 0 < x < ∞            */
export function asymmetryFromSize(x: number): number {
    if (x < 0.1) return 0;
    if (x < 1) return 0.5 * x; // linear rise
    if (x < 10) return 0.5 + 0.05 * (x - 1); // mild slope
    return 0.9;
}

export interface SpectralMieInputs {
    /** Aerosol optical depth at 550nm */
    tau550: number;
    /** Between 0 and 1. Where 0 means complete settling and 1.0 means no settling. For Earth, typically 0.15 */
    settlingFraction: number;
    /** Effective radius of the aerosol particles in meters. */
    particleRadius: number; // effective radius [m]
    /** The Ångström exponent for the aerosol size distribution. A value of 0 means a flat β spectrum. */
    angstromAlpha: number;
}

export interface SpectralMieResults {
    /** The aerosol scale height in meters. */
    aerosolScaleHeight: number;

    /** Per-channel Mie scattering coefficients β_M (m⁻¹) at the specified wavelengths. */
    betaRGB: [number, number, number];

    /** Per-channel Mie asymmetry factors g_M (dimensionless) at the specified wavelengths. */
    gRGB: [number, number, number];
}

/**
 * @param mieInputs The spectral Mie inputs
 * @param atmosphereGasScaleHeight The scale height of the atmosphere's gas in meters.
 * @param waveLengths The 3 wavelengths for which to compute the scattering parameters, in meters.
 * @returns Mie scattering's Cornette-Shanks parameters (β & g) for each RGB channel.
 */
export function computeSpectralMie(
    mieInputs: DeepReadonly<SpectralMieInputs>,
    atmosphereGasScaleHeight: number,
    waveLengths: readonly [number, number, number],
): SpectralMieResults {
    const lambda = waveLengths;
    const f = mieInputs.settlingFraction;
    const alpha = mieInputs.angstromAlpha;

    // 1. scale heights
    const Hg = atmosphereGasScaleHeight;
    const Hm = getAerosolScaleHeight(Hg, f);

    // 2. base β at 550nm and spectral version via Ångström law
    const beta550 = betaFromAerosolOpticalDepth(mieInputs.tau550, Hm);
    const betaRGB = lambda.map((λ) => beta550 * Math.pow(λ / 550e-9, -alpha)) as [number, number, number];

    // 3. asymmetry per λ using size parameter x = 2πr/λ
    const xRGB = lambda.map((λ) => (2 * Math.PI * mieInputs.particleRadius) / λ);
    const gRGB = xRGB.map(asymmetryFromSize) as [number, number, number];

    return { aerosolScaleHeight: Hm, betaRGB, gRGB };
}
