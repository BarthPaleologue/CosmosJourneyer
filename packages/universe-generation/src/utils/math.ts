export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
