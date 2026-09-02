//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

export type AerosolModel = {
    readonly tau550: number;
    readonly settlingCoefficient: number;
    readonly particleRadius: number;
    readonly angstromExponent: number;
};

export type SpectralMieResults = {
    readonly aerosolScaleHeight: number;
    readonly betaRGB: readonly [number, number, number];
    readonly gRGB: readonly [number, number, number];
};

export function getAerosolScaleHeight(pressureScaleHeight: number, settlingCoefficient: number): number {
    return pressureScaleHeight * settlingCoefficient;
}

export function betaFromAerosolOpticalDepth(tau550: number, aerosolScaleHeight: number): number {
    return aerosolScaleHeight > 0 ? tau550 / aerosolScaleHeight : 0;
}

export function asymmetryFromSize(sizeParameter: number, asymptote = 0.9, transition = 1, exponent = 1.5): number {
    if (sizeParameter <= 0) {
        return 0;
    }
    return asymptote * (1 - Math.exp(-((sizeParameter / transition) ** exponent)));
}

export function getMieSizeParameter(particleRadius: number, wavelength: number): number {
    return wavelength > 0 ? (2 * Math.PI * particleRadius) / wavelength : 0;
}

export function computeSpectralMie(
    aerosols: Readonly<AerosolModel>,
    atmosphereGasScaleHeight: number,
    wavelengths: readonly [number, number, number],
): SpectralMieResults {
    const aerosolScaleHeight = getAerosolScaleHeight(atmosphereGasScaleHeight, aerosols.settlingCoefficient);
    const beta550 = betaFromAerosolOpticalDepth(aerosols.tau550, aerosolScaleHeight);
    const coefficientAt = (wavelength: number): number => beta550 * (wavelength / 550e-9) ** -aerosols.angstromExponent;
    const asymmetryAt = (wavelength: number): number =>
        asymmetryFromSize(getMieSizeParameter(aerosols.particleRadius, wavelength));

    return {
        aerosolScaleHeight,
        betaRGB: [coefficientAt(wavelengths[0]), coefficientAt(wavelengths[1]), coefficientAt(wavelengths[2])],
        gRGB: [asymmetryAt(wavelengths[0]), asymmetryAt(wavelengths[1]), asymmetryAt(wavelengths[2])],
    };
}
