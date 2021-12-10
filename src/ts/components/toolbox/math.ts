export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function mix(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}

// garantie fonctionnelle 
// https://www.desmos.com/calculator/968c7smugx
export function smin(a: number, b: number, k: number): number {
    let res = Math.exp(-k * a) + Math.exp(-k * b);
    return -Math.log(res) / k;
}

export function sCeil(x: number, ceil: number, k: number): number {
    return -Math.log(Math.exp(-k * x) + Math.exp(-k * ceil)) / k;
}

export function sCeilGradient(x: number, ceil: number, k: number): number {
    let ekx = Math.exp(-k * x);
    return -ekx / (ekx + Math.exp(-k * ceil));
}

export function sFloor(x: number, floor: number, k: number): number {
    return Math.log(Math.exp(k * x) + Math.exp(k * floor)) / k;
}

export function sFloorGradient(x: number, floor: number, k: number): number {
    let ekx = Math.exp(k * x);
    return ekx / (ekx + Math.exp(k * floor));
}

export function smax(a: number, b: number, k: number): number {
    let res = Math.exp(k * a) + Math.exp(k * b);
    return Math.log(res) / k;
}

export function sAbs(x: number, k: number): number {
    return Math.log(Math.exp(k * x) + Math.exp(-k * x)) / k;
}

export function sAbsGradient(x: number, k: number): number {
    // c'est littéralement une tangente hyperblique
    let ekx = Math.exp(k * x);
    let emkx = 1 / ekx;
    return (ekx - emkx) / (ekx + emkx);
}


