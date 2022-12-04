import { LVector3, Vec3 } from "./algebra";
import { Vector3 } from "@babylonjs/core";

// https://www.desmos.com/calculator/968c7smugx
/**
 * Smooth minimum between a and b
 * @param a the first value
 * @param b the second value
 * @param k the smoothness factor
 * @returns the smooth minimum between a and b
 */
export function smin(a: number, b: number, k: number): number {
    const res = Math.exp(-k * a) + Math.exp(-k * b);
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
    const res = Math.exp(k * a) + Math.exp(k * b);
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
    const eku = Math.exp(k * u);
    const ekv = Math.exp(k * v);
    const ekuv = eku + ekv;

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
    const eku = Math.exp(k * u);
    const ekv = Math.exp(k * v);
    const ekuv = eku + ekv;

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
    const emkx = Math.exp(-k * x);
    const emkceil = Math.exp(-k * ceil);

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
    const ekx = Math.exp(k * x);
    const ekfloor = Math.exp(k * floor);

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
    const ekx = Math.exp(k * x);
    const emkx = 1 / ekx;

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
    const sampleX = s * (x - 0.5);
    const tanhX = Math.tanh(sampleX);
    const tanhHalfS = Math.tanh(0.5 * s);

    if (grad) grad.scaleInPlace((0.5 * s * (1.0 - tanhX ** 2)) / tanhHalfS);

    return 0.5 * (1 + tanhX / tanhHalfS);
}

/**
 * Applies power function to a value and scales the optional gradient accordingly
 * @param y the value to apply the power function to
 * @param exponent the exponent of the power function
 * @param grad the optional gradient to be modified
 */
export function pow(y: number, exponent: number, grad?: Vec3): number {
    if (grad) grad.scaleInPlace(exponent * y ** (exponent - 1));
    return y ** exponent;
}

export function minimumValue(y: number, minValue: number, grad?: Vec3): number {
    if (minValue == 1) throw new Error("minValue must be != 1");

    // TODO: ne pas hardcoder k
    const newY = sFloor(y - minValue, 0, 100.0, grad) / (1 - minValue);
    if (grad) grad.scaleInPlace(1 / (1 - minValue));
    return newY;
}

/**
 * Adds two values and adds the optional gradients in grad1
 * @param x1 the first value
 * @param x2 the second value
 * @param grad1 the optional gradient of x1 WILL STORE THE RESULT
 * @param grad2 the optional gradient of x2
 */
export function add(x1: number, x2: number, grad1?: LVector3, grad2?: LVector3): number {
    if (grad1 && grad2) grad1.addInPlace(grad2);
    return x1 + x2;
}

/**
 * Scales the value and the optional gradient accordingly
 * @param x the value to scale
 * @param scale the scale factor
 * @param grad the optional gradient to be modified
 */
export function scale(x: number, scale: number, grad?: LVector3): number {
    if (grad) grad.scaleInPlace(scale);
    return x * scale;
}

/**
 * Applies smoothstep to a value and scales the optional gradient accordingly
 * @param edge0 the minimum value of the smoothstep
 * @param edge1 the maximum value of the smoothstep
 * @param x the value to apply the smoothstep to
 * @param grad?? the optional gradient to be modified
 * @see https://www.wikiwand.com/en/Smoothstep
 */
export function smoothstep(edge0: number, edge1: number, x: number, grad?: Vec3): number {
    if (x < edge0) {
        if (grad) grad.scaleInPlace(0);
        return 0;
    } else if (x >= edge1) return 1;

    // Scale/bias into [0..1] range
    x = (x - edge0) / (edge1 - edge0);

    if (grad) {
        grad.scaleInPlace(1 / (edge1 - edge0));
        grad.scaleInPlace(6 * x - 6 * x ** 2);
    }

    return 3 * x ** 2 - 2 * x ** 3;
}

/**
 * Multiplies x1 and x2 and scales the optional gradient accordingly and stores it in grad1
 * @param x1 the first value
 * @param x2 the second value
 * @param grad1 the gradient of x1 WILL STORE THE RESULT
 * @param grad2 the gradient of x2 WILL NOT BE MODIFIED
 */
export function multiply(x1: number, x2: number, grad1?: LVector3, grad2?: LVector3): number {
    if (grad1 && grad2) {
        grad1.scaleInPlace(x2);
        grad1.addInPlace(grad2.scale(x1));
    }
    return x1 * x2;
}

export function rayIntersectSphere(rayOrigin: Vector3, rayDir: Vector3, spherePosition: Vector3, sphereRadius: number): [boolean, number, number] {
    const relativeOrigin = rayOrigin.subtract(spherePosition); // rayOrigin in sphere space

    const a = 1.0;
    const b = 2.0 * Vector3.Dot(relativeOrigin, rayDir);
    const c = Vector3.Dot(relativeOrigin, relativeOrigin) - sphereRadius ** 2;

    const d = b * b - 4.0 * a * c;

    if (d < 0.0) return [false, 0, 0]; // no intersection

    const s = Math.sqrt(d);

    const r0 = (-b - s) / (2.0 * a);
    const r1 = (-b + s) / (2.0 * a);

    const t0 = Math.max(Math.min(r0, r1), 0.0);
    const t1 = Math.max(Math.max(r0, r1), 0.0);

    return [t1 > 0.0, t0, t1];
}
