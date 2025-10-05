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

/**
 * Represents a color in the RGB color space.
 */
export type RGBColor = {
    /**
     * The red component value (0-1).
     */
    r: number;

    /**
     * The green component value (0-1).
     */
    g: number;

    /**
     * The blue component value (0-1).
     */
    b: number;
};

/**
 * Represents a color in the HSV (Hue, Saturation, Value) color space.
 */
export type HSVColor = {
    /**
     * The hue component value in degrees (0-360).
     */
    h: number;

    /**
     * The saturation component value (0-1).
     */
    s: number;

    /**
     * The value (brightness) component value (0-1).
     */
    v: number;
};

/**
 * Converts an HSV color to RGB color space.
 * @param hsv - The HSV color to convert
 * @returns The equivalent RGB color
 */
export function hsvToRgb(hsv: HSVColor): RGBColor {
    const { h, s, v } = hsv;

    // Normalize hue to 0-360 range
    const normalizedHue = ((h % 360) + 360) % 360;

    const c = v * s; // Chroma
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
