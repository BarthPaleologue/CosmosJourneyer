import { Vec3 } from "./algebra";

// https://www.desmos.com/calculator/968c7smugx
/**
 * Smooth minimum between a and b
 * @param a the first value
 * @param b the second value
 * @param k the smoothness factor
 * @returns the smooth minimum between a and b
 */
export function smin(a: number, b: number, k: number): number {
    let res = Math.exp(-k * a) + Math.exp(-k * b);
    return -Math.log(res) / k;
}

/**
 * Smooth maximum between a and b
 * @param a the first value
 * @param b the second value
 * @param k the smoothness factor
 * @returns the smooth maximum between a and b
 */
export function smax(a: number, b: number, k: number): number {
    let res = Math.exp(k * a) + Math.exp(k * b);
    return Math.log(res) / k;
}

// based on research folder
/**
 * The smooth minimum between u and v and computes the gradient
 * @param u the first value
 * @param v the second value
 * @param k the smoothness factor
 * @param gradU the gradient of u
 * @param gradV the gradient of v
 * @returns the smooth minimum between u and v
 */
export function sMinGradient(u: number, v: number, k: number, gradU: Vec3, gradV: Vec3): number {
    let eku = Math.exp(k * u);
    let ekv = Math.exp(k * v);
    let ekuv = eku + ekv;

    // TODO: terminer cela et aussi comment retourner le gradient ?

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
export function sCeil(x: number, ceil: number, k: number, grad?: Vec3): number {
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
export function sFloor(x: number, floor: number, k: number, grad?: Vec3): number {
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
export function sAbs(x: number, k: number, grad?: Vec3): number {
    let ekx = Math.exp(k * x);
    let emkx = Math.exp(-k * x);

    if (grad) grad.scaleInPlace((ekx - emkx) / (ekx + emkx));

    return Math.log(Math.exp(k * x) + Math.exp(-k * x)) / k;
}


