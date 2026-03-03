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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { abs, add, f, mod, mul, normalize, remap, splitVec, sub, vec, vec3 } from "babylonjs-shading-language";

import type { NonEmptyArray } from "../types";

export function triangleWave3d(input: NodeMaterialConnectionPoint, phase: Vector3, period: number) {
    return abs(sub(mod(add(input, vec(phase)), f(period)), f(period * 0.5)));
}

export function unpackNormal(
    normalMapSample: NodeMaterialConnectionPoint,
    options?: Partial<{ normalStrength: NodeMaterialConnectionPoint; invertY: boolean }>,
) {
    let unpackedNormal = remap(normalMapSample, ["number", [0, 1], [-1, 1]]);
    if (options?.invertY !== undefined && options.invertY) {
        unpackedNormal = mul(unpackedNormal, vec(new Vector3(1, -1, 1)));
    }

    if (options?.normalStrength !== undefined) {
        unpackedNormal = scaleTangentNormal(unpackedNormal, options.normalStrength);
    }

    return unpackedNormal;
}

export function addN(inputs: NonEmptyArray<NodeMaterialConnectionPoint>) {
    let result = inputs[0];
    for (const input of inputs) {
        if (input === inputs[0]) {
            continue;
        }

        result = add(result, input);
    }
    return result;
}

export function scaleTangentNormal(
    tangentNormal: NodeMaterialConnectionPoint,
    normalStrength: NodeMaterialConnectionPoint,
) {
    const tangentNormalSplit = splitVec(tangentNormal);
    return normalize(
        vec3({
            xy: mul(tangentNormalSplit.xyOut, normalStrength),
            z: tangentNormalSplit.z,
        }),
    );
}
