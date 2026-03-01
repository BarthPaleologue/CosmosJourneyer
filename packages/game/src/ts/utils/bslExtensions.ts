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
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { abs, add, div, f, mod, mul, splitVec, sub, textureSample, vec, vec2 } from "babylonjs-shading-language";

export function triangleWave3d(input: NodeMaterialConnectionPoint, phase: Vector3, period: number) {
    return abs(sub(mod(add(input, vec(phase)), f(period)), f(period * 0.5)));
}

export function triPlanarSamples<TextureTuple extends Array<NodeMaterialConnectionPoint>>(
    textures: TextureTuple,
    samplePoint: NodeMaterialConnectionPoint,
    surfaceNormal: NodeMaterialConnectionPoint,
): TextureTuple {
    const samplePointSplit = splitVec(samplePoint);

    const surfaceNormalAbs = abs(surfaceNormal);
    const blendWeight = mul(surfaceNormalAbs, surfaceNormalAbs);
    const blendWeightSplit = splitVec(blendWeight);
    const blendWeightSum = add(add(blendWeightSplit.x, blendWeightSplit.y), blendWeightSplit.z);
    const normalizedBlendWeight = div(blendWeight, blendWeightSum);
    const normalizedBlendWeightSplit = splitVec(normalizedBlendWeight);

    const uvX = vec2(samplePointSplit.z, samplePointSplit.y);
    const uvY = vec2(samplePointSplit.x, samplePointSplit.z);
    const uvZ = samplePointSplit.xyOut;

    return textures.map((texture) => {
        const sampleX = textureSample(texture, uvX).rgba;
        const sampleY = textureSample(texture, uvY).rgba;
        const sampleZ = textureSample(texture, uvZ).rgba;

        return add(
            add(mul(sampleX, normalizedBlendWeightSplit.x), mul(sampleY, normalizedBlendWeightSplit.y)),
            mul(sampleZ, normalizedBlendWeightSplit.z),
        );
    }) as TextureTuple;
}
