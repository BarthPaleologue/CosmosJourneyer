import type { HSVColor, LinearSrgbColor } from "@cosmos-journeyer/physics";

/**
 * Wraps hue into the [0, 360) range.
 * @param hsv Color expressed as hue in degrees, saturation, and value.
 * @returns The equivalent linear sRGB color.
 */
export function hsvToRgb(hsv: Readonly<HSVColor>): LinearSrgbColor {
    const { h, s, v } = hsv;
    const normalizedHue = ((h % 360) + 360) % 360;

    const c = v * s;
    const x = c * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
    const m = v - c;

    let r: number, g: number, b: number;

    if (normalizedHue >= 0 && normalizedHue < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (normalizedHue >= 60 && normalizedHue < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (normalizedHue >= 120 && normalizedHue < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (normalizedHue >= 180 && normalizedHue < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (normalizedHue >= 240 && normalizedHue < 300) {
        r = x;
        g = 0;
        b = c;
    } else {
        r = c;
        g = 0;
        b = x;
    }

    return {
        r: r + m,
        g: g + m,
        b: b + m,
    };
}
