import {Vec3} from "./algebra";

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
 * @param k the smoothness factor (should be > 1)
 * @returns the smooth maximum between a and b
 */
export function smax(a: number, b: number, k: number): number {
    let res = Math.exp(k * a) + Math.exp(k * b);
    return Math.log(res) / k;
}

// based on research folder
/**
 * The smooth minimum between u and v and computes the gradient
 * @param u the first value (should be in [0, 1])
 * @param v the second value (should be in [0, 1])
 * @param k the smoothness factor (should be > 1)
 * @param gradU the gradient of u
 * @param gradV the gradient of v
 * @returns the smooth minimum between u and v
 */
export function sMinGradient(u: number, v: number, k: number, gradU: Vec3, gradV: Vec3): number {
    let eku = Math.exp(k * u);
    let ekv = Math.exp(k * v);
    let ekuv = eku + ekv;

    gradU.x = (eku * gradV.x + ekv * gradU.x) / ekuv;
    gradU.y = (eku * gradV.y + ekv * gradU.y) / ekuv;
    gradU.z = (eku * gradV.z + ekv * gradU.z) / ekuv;

    return smin(u, v, k);
}

/**
 * The smooth maximum between u and v and computes the gradient
 * @param u the first value
 * @param v the second value
 * @param k the smoothness factor
 * @param gradU the gradient of u
 * @param gradV the gradient of v
 * @returns the smooth maximum between u and v and overrides gradU with the new gradient
 */
export function sMaxGradient(u: number, v: number, k: number, gradU?: Vec3, gradV?: Vec3): number {
    let eku = Math.exp(k * u);
    let ekv = Math.exp(k * v);
    let ekuv = eku + ekv;

    if (gradU && gradV) {
        gradU.scaleInPlace(eku / ekuv);
        gradV.scaleInPlace(ekv / ekuv);
    }

    return Math.log(ekuv) / k;
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
    let emkx = 1 / ekx;

    if (grad) grad.scaleInPlace((ekx - emkx) / (ekx + emkx));

    return Math.log(ekx + emkx) / k;
}

//https://www.desmos.com/calculator/xtepjehtuf?lang=fr
/**
 * Applies tanh-based interpolation to x given s the sharpness parameter and alters the gradient accordingly
 * @param x The value to interpolate
 * @param s The sharpness factor
 * @param grad The gradient to alter
 */
export function tanhSharpen(x: number, s: number, grad?: Vec3): number {
    let sampleX = s * (x - 0.5);
    let tanhX = Math.tanh(sampleX);
    let tanhHalfS = Math.tanh(0.5 * s);

    if (grad) grad.scaleInPlace(0.5 * s * (1.0 - tanhX ** 2) / tanhHalfS)

    return 0.5 * (1 + (tanhX / tanhHalfS));
}

export function gcd(a: number, b: number): number {
    if (!b) return a;

    return gcd(b, a % b);
}


