/**
 * @param value Number to constrain.
 * @param min Lower bound of the interval.
 * @param max Upper bound of the interval.
 * @returns The value clamped to the interval.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * @param a Start value.
 * @param b End value.
 * @param t Interpolation factor, where 0 selects a and 1 selects b.
 * @returns The value between a and b at factor t.
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
