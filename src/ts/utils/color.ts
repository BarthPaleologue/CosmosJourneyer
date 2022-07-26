/**
 * Converts an HSB/HSV color value to RGB.
 * @param h The hue (between 0 and 360)
 * @param s The saturation (between 0 and 1)
 * @param v The value or brightness (between 0 and 1)
 * @see https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
 */
export function HSVtoRGB(h: number, s: number, v: number) {
    const h01 = (((h / 360) % 1) + 1) % 1;
    const i = Math.floor(h01 * 6);
    const f = h01 * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            return [v, t, p];
        case 1:
            return [q, v, p];
        case 2:
            return [p, v, t];
        case 3:
            return [p, q, v];
        case 4:
            return [t, p, v];
        case 5:
            return [v, p, q];
        default:
            throw new Error("HSVtoRGB: i is not between 0 and 6");
    }
}