import { integrateBlackBodySpectrum, normalizeLinearSrgb, xyzToLinearSrgb } from "@cosmos-journeyer/physics";
import type { LinearSrgbColor } from "@cosmos-journeyer/physics";

export {
    integrateBlackBodySpectrum,
    integrateSpectrum,
    normalizeLinearSrgb,
    xyzToLinearSrgb,
} from "@cosmos-journeyer/physics";

/**
 * Computes a black body colour using the compatibility API, adding white for out-of-gamut colours.
 * Applies no sRGB display encoding or photometric intensity.
 * @param temperature The positive black body temperature in kelvin.
 * @returns Linear sRGB normalized so that the brightest channel equals 1.
 */
export function getRgbFromTemperature(temperature: number): LinearSrgbColor {
    const xyz = integrateBlackBodySpectrum(temperature);
    return normalizeLinearSrgb(xyzToLinearSrgb(xyz));
}
