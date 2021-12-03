export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function mix(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}

export function smin(a: number, b: number, k: number): number {
    let res = Math.exp(-k * a) + Math.exp(-k * b);
    return -Math.log(res) / k;
}

export function smin2(a: number, b: number, k: number): number {
    let h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
    return mix(a, b, h) - k * h * (1.0 - h);
}

export function smin2Gradient(a: number, b: number, k: number): number {
    let h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
    return mix(1.0, -1.0, h) * (1.0 - h) / k;
}

// généré avec copilot alors faudra vérifier
export function smax(a: number, b: number, k: number): number {
    let res = Math.exp(-k * a) + Math.exp(-k * b);
    return Math.log(res) / k;
}



