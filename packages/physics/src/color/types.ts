/** Linear sRGB (D65); negative and HDR (> 1) components are allowed. */
export type LinearSrgbColor = {
    r: number;
    g: number;
    b: number;
};

/** HSV colour with hue in degrees and saturation/value in [0, 1]. */
export type HSVColor = {
    h: number;
    s: number;
    v: number;
};

/** Unnormalized CIE XYZ; units follow the integrated spectrum. No 683 lm/W factor is applied. */
export type XyzColor = {
    x: number;
    y: number;
    z: number;
};
