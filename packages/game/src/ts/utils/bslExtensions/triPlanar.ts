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
    mix,
    mul,
    normalize,
    pow,
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

export type TriPlanarMaterialSamples = {
    albedo: NodeMaterialConnectionPoint;
    roughness: NodeMaterialConnectionPoint;
    normal: NodeMaterialConnectionPoint;
    ambientOcclusion: NodeMaterialConnectionPoint;
};

/**
 * Samples terrain material maps along three orthogonal projections and blends by surface orientation.
 * @param textures - Albedo/roughness and normal/ambient-occlusion texture pairs.
 * @param samplePoint - Position whose coordinates provide the three projection UV pairs.
 * @param surfaceNormal - Surface normal used to weight the X-, Y-, and Z-facing projections.
 * @param options - Optional normal-map strength and green-channel inversion settings.
 * @returns Blended albedo, roughness, ambient occlusion, and normalized normal shader values.
 */
export function triPlanarMaterial(
    textures: TerrainTextures,
    samplePoint: NodeMaterialConnectionPoint,
    surfaceNormal: NodeMaterialConnectionPoint,
    options?: Partial<{ normalStrength: NodeMaterialConnectionPoint; invertNormalY: boolean }>,
): TriPlanarMaterialSamples {
    const { uvX, uvY, uvZ } = getTriPlanarUVs(samplePoint);

    const albedoRoughnessTexture = uniformTexture2d(textures.albedoRoughness).source;
    const { rgb: albedoX, a: roughnessX } = textureSample(albedoRoughnessTexture, uvX, { convertToLinearSpace: true });
    const { rgb: albedoY, a: roughnessY } = textureSample(albedoRoughnessTexture, uvY, { convertToLinearSpace: true });
    const { rgb: albedoZ, a: roughnessZ } = textureSample(albedoRoughnessTexture, uvZ, { convertToLinearSpace: true });

    const normalAmbientOcclusionTexture = uniformTexture2d(textures.normalAmbientOcclusion).source;
    const { rgb: normalX01, a: ambientOcclusionX } = textureSample(normalAmbientOcclusionTexture, uvX);
    const { rgb: normalY01, a: ambientOcclusionY } = textureSample(normalAmbientOcclusionTexture, uvY);
    const { rgb: normalZ01, a: ambientOcclusionZ } = textureSample(normalAmbientOcclusionTexture, uvZ);

    const invertY = options?.invertNormalY ?? false;
    const normalStrength = options?.normalStrength ?? f(1);
    const tangentNormalX = unpackNormal(normalX01, { normalStrength, invertY });
    const tangentNormalY = unpackNormal(normalY01, { normalStrength, invertY });
    const tangentNormalZ = unpackNormal(normalZ01, { normalStrength, invertY });

    const { finalNormalX, finalNormalY, finalNormalZ } = whiteoutBlend(
        tangentNormalX,
        tangentNormalY,
        tangentNormalZ,
        surfaceNormal,
    );

    const blend = getTriPlanarBlending(surfaceNormal, 4.0);
    const albedo = blend(albedoX, albedoY, albedoZ);
    const roughness = blend(roughnessX, roughnessY, roughnessZ);
    const ambientOcclusion = blend(ambientOcclusionX, ambientOcclusionY, ambientOcclusionZ);
    const normal = normalize(blend(finalNormalX, finalNormalY, finalNormalZ));

    return {
        albedo,
        roughness,
        normal,
        ambientOcclusion,
    };
}

/**
 * Derives the three orthogonal UV pairs from a 3D shader-space position.
 * @param samplePoint - Position whose X, Y, and Z components become projection coordinates.
 * @returns UVs for projections onto the YZ, XZ, and XY planes.
 */
export function getTriPlanarUVs(samplePoint: NodeMaterialConnectionPoint): {
    uvX: NodeMaterialConnectionPoint;
    uvY: NodeMaterialConnectionPoint;
    uvZ: NodeMaterialConnectionPoint;
} {
    const { x, y, z } = splitVec(samplePoint);
    return {
        uvX: vec2(z, y),
        uvY: vec2(x, z),
        uvZ: vec2(x, y),
    };
}

/**
 * Reorients each projection's tangent-space normal and combines it with the surface normal.
 * @param tangentNormalX - Normal sample for the projection facing the X axis.
 * @param tangentNormalY - Normal sample for the projection facing the Y axis.
 * @param tangentNormalZ - Normal sample for the projection facing the Z axis.
 * @param surfaceNormal - Geometric surface normal that supplies each projection's dominant axis.
 * @returns Reoriented normals for the X, Y, and Z projections, ready for weighted blending.
 */
export function whiteoutBlend(
    tangentNormalX: NodeMaterialConnectionPoint,
    tangentNormalY: NodeMaterialConnectionPoint,
    tangentNormalZ: NodeMaterialConnectionPoint,
    surfaceNormal: NodeMaterialConnectionPoint,
): {
    finalNormalX: NodeMaterialConnectionPoint;
    finalNormalY: NodeMaterialConnectionPoint;
    finalNormalZ: NodeMaterialConnectionPoint;
} {
    // Whiteout blend from Ben Golus' blog https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a#da52
    const surfaceNormalZY = swizzle(surfaceNormal, "zy");
    const surfaceNormalXZ = swizzle(surfaceNormal, "xz");
    const surfaceNormalXY = swizzle(surfaceNormal, "xy");
    const { x: surfaceNormalX, y: surfaceNormalY, z: surfaceNormalZ } = splitVec(surfaceNormal);

    const tangentNormalXSplit = splitVec(tangentNormalX);
    const tangentNormalYSplit = splitVec(tangentNormalY);
    const tangentNormalZSplit = splitVec(tangentNormalZ);

    // Note about the sign of tangentNormalXYZSplit.z: we expect it to be > 0, so we can drop the abs() call from the article
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

/**
 * Creates a closure that blends three projected samples using powered normal components.
 * @param surfaceNormal - Surface normal whose absolute components determine projection weights.
 * @param blendSharpness - Exponent controlling how strongly weights favor the dominant axis.
 * @returns Function that blends X-, Y-, and Z-projection samples with normalized weights.
 */
export function getTriPlanarBlending(surfaceNormal: NodeMaterialConnectionPoint, blendSharpness: number) {
    const blendWeights = pow(abs(surfaceNormal), vec(Vector3.One().scaleInPlace(blendSharpness)));
    const blendWeightsSum = dot(blendWeights, vec(Vector3.One()));
    const normalizedBlendWeights = splitVec(div(blendWeights, blendWeightsSum));
    return (
        sampleX: NodeMaterialConnectionPoint,
        sampleY: NodeMaterialConnectionPoint,
        sampleZ: NodeMaterialConnectionPoint,
    ): NodeMaterialConnectionPoint => {
        return addN([
            mul(sampleX, normalizedBlendWeights.x),
            mul(sampleY, normalizedBlendWeights.y),
            mul(sampleZ, normalizedBlendWeights.z),
        ]);
    };
}

/**
 * Interpolates each channel of two tri-planar material samples.
 * @param samplesA - First material sample set, used at blend factor zero.
 * @param samplesB - Second material sample set, used at blend factor one.
 * @param blendFactor - Shader interpolation factor; values outside [0, 1] extrapolate.
 * @returns Interpolated channels with the blended normal renormalized.
 */
export function mixTriPlanarSamples(
    samplesA: TriPlanarMaterialSamples,
    samplesB: TriPlanarMaterialSamples,
    blendFactor: NodeMaterialConnectionPoint,
): TriPlanarMaterialSamples {
    return {
        albedo: mix(samplesA.albedo, samplesB.albedo, blendFactor),
        roughness: mix(samplesA.roughness, samplesB.roughness, blendFactor),
        normal: normalize(mix(samplesA.normal, samplesB.normal, blendFactor)),
        ambientOcclusion: mix(samplesA.ambientOcclusion, samplesB.ambientOcclusion, blendFactor),
    };
}
