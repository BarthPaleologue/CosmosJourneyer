import { Vector3 } from "./algebra";

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

export function smax(a: number, b: number, k: number): number {
    let res = Math.exp(k * a) + Math.exp(k * b);
    return Math.log(res) / k;
}

// based on research folder
export function sMinGradient(u: number, v: number, k: number, gradU: Vector3, gradV: Vector3): number {
    let eku = Math.exp(k * u);
    let ekv = Math.exp(k * v);
    let ekuv = eku + ekv;

    let gX = (eku * gradV.x + ekv * gradU.x) / (ekuv);
    let gY = (eku * gradV.y + ekv * gradU.y) / (ekuv);
    let gZ = (eku * gradV.z + ekv * gradU.z) / (ekuv);

    return 0;
}

/**
 * Applies smooth min to a value and scales the optional gradient accordingly.
 * @param x the value to apply the smooth min to
 * @param ceil the ceil value
 * @param k the smoothness factor
 * @param grad the optional gradient to be modified
 * @returns the result of the smooth min
 */
export function sCeil(x: number, ceil: number, k: number, grad?: Vector3): number {
    let emkx = Math.exp(-k * x);
    let emkceil = Math.exp(-k * ceil);

    if (grad) grad.scaleInPlace(-emkx / (emkx + emkceil));

    return -Math.log(emkx + emkceil) / k;
}

/**
 * Applies smooth max to value and scales the optional gradient accordingly
 * @param x the value to apply the smooth max to
 * @param floor the floor value
 * @param k the smoothness factor
 * @param grad the optional gradient to be modified
 * @returns the smooth max value between floor and x 
 */
export function sFloor(x: number, floor: number, k: number, grad?: Vector3): number {
    let ekx = Math.exp(k * x);
    let ekfloor = Math.exp(k * floor);

    if (grad) grad.scaleInPlace(ekx / (ekx + ekfloor));

    return Math.log(ekx + ekfloor) / k;
}

/**
 * Applies smooth absolute to a value and scales the optional gradient accordingly
 * @param x the value to apply the smooth absolute to
 * @param k the smoothness factor
 * @param grad the optional gradient to be modified
 * @returns the smooth absolute value of x
 */
export function sAbs(x: number, k: number, grad?: Vector3): number {
    let ekx = Math.exp(k * x);
    let emkx = Math.exp(-k * x);

    if (grad) grad.scaleInPlace((ekx - emkx) / (ekx + emkx));

    return Math.log(Math.exp(k * x) + Math.exp(-k * x)) / k;
}


