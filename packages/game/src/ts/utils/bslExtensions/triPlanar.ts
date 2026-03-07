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
import {
    abs,
    add,
    div,
    dot,
    f,
    mul,
    normalize,
    pow,
    sign,
    splitVec,
    swizzle,
    textureSample,
    uniformTexture2d,
    vec,
    vec2,
    vec3,
} from "babylonjs-shading-language";

import type { TerrainTextures } from "@/frontend/assets/textures/terrains";

import { addN, unpackNormal } from "./utils";

export function triPlanarMaterial(
    textures: TerrainTextures,
    samplePoint: NodeMaterialConnectionPoint,
    surfaceNormal: NodeMaterialConnectionPoint,
    options?: Partial<{ perturbNormalStrength: number; invertNormalY: boolean }>,
): {
    albedo: NodeMaterialConnectionPoint;
    metallic: NodeMaterialConnectionPoint;
    roughness: NodeMaterialConnectionPoint;
    normal: NodeMaterialConnectionPoint;
} {
    let { uvX, uvY, uvZ } = getTriPlanarUVs(samplePoint);

    const axisSign = splitVec(sign(surfaceNormal));
    uvX = mul(uvX, vec2(axisSign.x, f(1)));
    uvY = mul(uvY, vec2(axisSign.y, f(1)));
    uvZ = mul(uvZ, vec2(axisSign.z, f(1)));

    const albedoRoughnessTexture = uniformTexture2d(textures.albedoRoughness).source;
    const { rgb: albedoX, a: roughnessX } = textureSample(albedoRoughnessTexture, uvX, { convertToLinearSpace: true });
    const { rgb: albedoY, a: roughnessY } = textureSample(albedoRoughnessTexture, uvY, { convertToLinearSpace: true });
    const { rgb: albedoZ, a: roughnessZ } = textureSample(albedoRoughnessTexture, uvZ, { convertToLinearSpace: true });

    const normalMetallicTexture = uniformTexture2d(textures.normalMetallic).source;
    const { rgb: normalX01, a: metallicX } = textureSample(normalMetallicTexture, uvX);
    const { rgb: normalY01, a: metallicY } = textureSample(normalMetallicTexture, uvY);
    const { rgb: normalZ01, a: metallicZ } = textureSample(normalMetallicTexture, uvZ);

    const normalStrength = f(options?.perturbNormalStrength ?? 1);
    const invertY = options?.invertNormalY ?? false;
    let tangentNormalX = unpackNormal(normalX01, { normalStrength, invertY });
    let tangentNormalY = unpackNormal(normalY01, { normalStrength, invertY });
    let tangentNormalZ = unpackNormal(normalZ01, { normalStrength, invertY });

    // Flip normal maps' x axis to account for flipped UVs, exactly like the reference shader.
    tangentNormalX = mul(tangentNormalX, vec3({ x: axisSign.x, y: f(1), z: f(1) }));
    tangentNormalY = mul(tangentNormalY, vec3({ x: axisSign.y, y: f(1), z: f(1) }));
    tangentNormalZ = mul(tangentNormalZ, vec3({ x: axisSign.z, y: f(1), z: f(1) }));

    const { finalNormalX, finalNormalY, finalNormalZ } = whiteoutBlend(
        tangentNormalX,
        tangentNormalY,
        tangentNormalZ,
        surfaceNormal,
    );

    const blend = getTriPlanarBlending(surfaceNormal, 4.0);
    const albedo = blend(albedoX, albedoY, albedoZ);
    const roughness = blend(roughnessX, roughnessY, roughnessZ);
    const metallic = blend(metallicX, metallicY, metallicZ);
    const normal = normalize(blend(finalNormalX, finalNormalY, finalNormalZ));

    return {
        albedo,
        roughness,
        metallic,
        normal,
    };
}

export function getTriPlanarUVs(samplePoint: NodeMaterialConnectionPoint) {
    const { x, y, z } = splitVec(samplePoint);
    return {
        uvX: vec2(z, y),
        uvY: vec2(x, z),
        uvZ: vec2(x, y),
    };
}

export function whiteoutBlend(
    tangentNormalX: NodeMaterialConnectionPoint,
    tangentNormalY: NodeMaterialConnectionPoint,
    tangentNormalZ: NodeMaterialConnectionPoint,
    surfaceNormal: NodeMaterialConnectionPoint,
) {
    // Whiteout blend from Ben Golus' blog https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a#da52
    const surfaceNormalZY = swizzle(surfaceNormal, "zy");
    const surfaceNormalXZ = swizzle(surfaceNormal, "xz");
    const surfaceNormalXY = swizzle(surfaceNormal, "xy");
    const { x: surfaceNormalX, y: surfaceNormalY, z: surfaceNormalZ } = splitVec(surfaceNormal);

    const tangentNormalXSplit = splitVec(tangentNormalX);
    const tangentNormalYSplit = splitVec(tangentNormalY);
    const tangentNormalZSplit = splitVec(tangentNormalZ);

    const whiteoutNormalX = vec3({
        xy: add(tangentNormalXSplit.xyOut, surfaceNormalZY),
        z: mul(tangentNormalXSplit.z, surfaceNormalX),
    });
    const whiteoutNormalY = vec3({
        xy: add(tangentNormalYSplit.xyOut, surfaceNormalXZ),
        z: mul(tangentNormalYSplit.z, surfaceNormalY),
    });
    const whiteoutNormalZ = vec3({
        xy: add(tangentNormalZSplit.xyOut, surfaceNormalXY),
        z: mul(tangentNormalZSplit.z, surfaceNormalZ),
    });

    return {
        finalNormalX: swizzle(whiteoutNormalX, "zyx"),
        finalNormalY: swizzle(whiteoutNormalY, "xzy"),
        finalNormalZ: swizzle(whiteoutNormalZ, "xyz"),
    };
}

export function getTriPlanarBlending(surfaceNormal: NodeMaterialConnectionPoint, blendSharpness: number) {
    const blendWeights = pow(abs(surfaceNormal), vec(Vector3.One().scaleInPlace(blendSharpness)));
    const blendWeightsSum = dot(blendWeights, vec(Vector3.One()));
    const normalizedBlendWeights = splitVec(div(blendWeights, blendWeightsSum));
    return (
        sampleX: NodeMaterialConnectionPoint,
        sampleY: NodeMaterialConnectionPoint,
        sampleZ: NodeMaterialConnectionPoint,
    ) => {
        return addN([
            mul(sampleX, normalizedBlendWeights.x),
            mul(sampleY, normalizedBlendWeights.y),
            mul(sampleZ, normalizedBlendWeights.z),
        ]);
    };
}
