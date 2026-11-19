//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { Vector4 } from "@babylonjs/core/Maths/math.vector";
import { add, div, f32, floor, fract, mul, oneMinus, splitVec, sub, swizzle, vec4 } from "babylonjs-shading-language";

/**
 * Builds the scalar value noise from noise1D.glsl.
 * @param r - Scalar shader coordinate to sample.
 * @returns Smooth deterministic noise in [0, 1].
 */
export function noise1d(r: NodeMaterialConnectionPoint): NodeMaterialConnectionPoint {
    const a = floor(r);
    const fraction = sub(r, a);
    const d = mul(mul(fraction, fraction), sub(3, mul(2, fraction)));
    const oneMinusD = oneMinus(d);

    const b = add(vec4({ x: a, y: a, z: a, w: a }), new Vector4(0, 1, 0, 1));
    const k1 = perm(swizzle(b, "xyxy"));
    const k2 = perm(add(swizzle(k1, "xyxy"), swizzle(b, "zzww")));

    const c = add(k2, a);
    const k3 = perm(c);
    const k4 = perm(add(c, 1));

    const o1 = fract(mul(k3, 1 / 41));
    const o2 = fract(mul(k4, 1 / 41));

    const o3 = add(mul(o2, d), mul(o1, oneMinusD));
    const o4 = splitVec(add(mul(swizzle(o3, "yw"), d), mul(swizzle(o3, "xz"), oneMinusD)));

    return add(mul(o4.y, d), mul(o4.x, oneMinusD));
}

/**
 * @param x - Lattice indices to permute.
 * @returns Polynomial hash modulo 289.
 */
function perm(x: NodeMaterialConnectionPoint): NodeMaterialConnectionPoint {
    return mod289(mul(add(mul(x, 34), 1), x));
}

/**
 * @param x - Scalar or vector shader value.
 * @returns Component-wise nonnegative remainder modulo 289.
 */
function mod289(x: NodeMaterialConnectionPoint): NodeMaterialConnectionPoint {
    return sub(x, mul(floor(mul(x, 1 / 289)), 289));
}

/**
 * @param noise - Noise function sampled at each octave.
 * @param p - Initial sample coordinate.
 * @param octaveCount - Positive number of octaves to combine.
 * @returns Weighted average of the samples, with double the frequency and half the amplitude at each octave.
 */
export function fbm(
    noise: (p: NodeMaterialConnectionPoint) => NodeMaterialConnectionPoint,
    p: NodeMaterialConnectionPoint,
    octaveCount: number,
) {
    let samplePoint = p;
    let result = f32(0.0);
    let amplitude = f32(1.0);
    let totalAmplitude = f32(0.0);
    for (let i = 0; i < octaveCount; i++) {
        const octave = mul(amplitude, noise(samplePoint));
        result = add(result, octave);
        totalAmplitude = add(totalAmplitude, amplitude);
        samplePoint = mul(samplePoint, 2);
        amplitude = div(amplitude, 2);
    }

    return div(result, totalAmplitude);
}
