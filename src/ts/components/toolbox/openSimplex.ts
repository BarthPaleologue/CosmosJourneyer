import { makeNoise3D } from "open-simplex-noise";
import { Vector } from "./algebra";

let noise = makeNoise3D(69);

/**
 * OpenSimplex between -1 and 1
 * @param p sample point
 * @returns noise value
 */
export function openSimplex3(p: Vector): number {
    if (p.dim != 3) throw Error("openSimplex3 exprects 3D Vector");
    return noise(p.x, p.y, p.z);
}

export function openSimplex301(p: Vector): number {
    return (1 + openSimplex3(p)) / 2;
}