import { getBlackBodySpectralExitance } from "../thermodynamics";
import { cie1931 } from "./cie1931";
import type { LinearSrgbColor, XyzColor } from "./types";

/**
 * Integrates a spectral density per metre with the CIE 1931 2° observer over 360–830 nm.
 * Trapezoidal quadrature uses a 5 nm step converted to metres:
 * `XYZ = ∫ spectrum(λ) [xBar, yBar, zBar](λ) dλ`.
 * Features narrower than 5 nm need rebinning before integration; a zero spectrum returns zero XYZ.
 * @param spectrum The spectral density per metre, evaluated at wavelengths in metres.
 * @returns Unnormalized XYZ in the integrated spectrum's units (observer-weighted W/m² for W/m²/m input), without the 683 lm/W factor.
 */
export function integrateSpectrum(spectrum: (wavelength: number) => number): XyzColor {
    const step = 5e-9;
    let x = 0;
    let y = 0;
    let z = 0;
    for (const [index, [xBar, yBar, zBar]] of cie1931.entries()) {
        const wavelength = (360 + index * 5) * 1e-9;
        const density = spectrum(wavelength);
        const endpointWeight = index === 0 || index === cie1931.length - 1 ? 0.5 : 1;
        const weightedDensity = density * step * endpointWeight;
        x += weightedDensity * xBar;
        y += weightedDensity * yBar;
        z += weightedDensity * zBar;
    }
    return { x, y, z };
}

/**
 * Integrates black body spectral exitance with the CIE 1931 observer.
 * Very cold spectra may underflow to zero.
 * @param temperature The positive black body temperature in kelvin.
 * @returns Unnormalized XYZ in observer-weighted W/m², without the 683 lm/W factor.
 */
export function integrateBlackBodySpectrum(temperature: number): XyzColor {
    return integrateSpectrum((wavelength) => getBlackBodySpectralExitance(temperature, wavelength));
}

/**
 * Converts CIE XYZ to linear sRGB with the D65 white point.
 * Applies no chromatic adaptation, normalization, clipping or display encoding.
 * @param xyz The unnormalized CIE XYZ tristimulus values.
 * @returns Linear sRGB preserving intensity, negative out-of-gamut channels and HDR values above 1.
 * @see https://www.w3.org/Graphics/Color/srgb
 */
export function xyzToLinearSrgb(xyz: Readonly<XyzColor>): LinearSrgbColor {
    const { x, y, z } = xyz;
    return {
        r: 3.2406255 * x - 1.537208 * y - 0.4986286 * z,
        g: -0.9689307 * x + 1.8757561 * y + 0.0415175 * z,
        b: 0.0557101 * x - 0.2040211 * y + 1.0569959 * z,
    };
}

/**
 * Adds the minimum neutral white once to eliminate negative channels, then scales the brightest channel to 1.
 * This deliberately desaturates out-of-gamut colours and discards intensity; do not use
 * it for photometric light colours normalized to Y = 1, or for absolute HDR radiance.
 * Adapted from John Walker's public-domain specrend.
 * @param color The linear sRGB colour to approximate and normalize.
 * @returns Linear sRGB with the brightest channel equal to 1, or black for a zero colour.
 * @see https://www.fourmilab.ch/documents/specrend/
 */
export function normalizeLinearSrgb(color: Readonly<LinearSrgbColor>): LinearSrgbColor {
    const { r, g, b } = color;
    const white = -Math.min(0, r, g, b);
    const maximum = Math.max(r, g, b) + white;
    if (maximum === 0) {
        return { r: 0, g: 0, b: 0 };
    }
    return { r: (r + white) / maximum, g: (g + white) / maximum, b: (b + white) / maximum };
}
