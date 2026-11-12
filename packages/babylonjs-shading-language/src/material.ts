// MIT License
//
// Copyright (c) 2025 Barthélemy Paléologue
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Light } from "@babylonjs/core/Lights/light";
import { PerturbNormalBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/perturbNormalBlock";
import { PBRMetallicRoughnessBlock } from "@babylonjs/core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { ReflectionBlock } from "@babylonjs/core/Materials/Node/Blocks/PBR/reflectionBlock";
import { SubSurfaceBlock } from "@babylonjs/core/Materials/Node/Blocks/PBR/subSurfaceBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";

import type { TargetOptions } from "./target";

export type PerturbNormalOptions = TargetOptions & {
    parallax: {
        viewDirection: NodeMaterialConnectionPoint;
        scale: NodeMaterialConnectionPoint;
    };
};

export type PerturbNormalOutput = {
    output: PerturbNormalBlock["output"];
    uvOffset: PerturbNormalBlock["uvOffset"];
};

/**
 * Perturbs the normal vector using the given parameters.
 * @param uv - The UV coordinates.
 * @param positionWorldVec3 - The world position vector.
 * @param normalWorldVec3 - The world normal vector.
 * @param normalTexture - The normal texture.
 * @param bumpStrengthFloat - The bump strength.
 * @param options - Optional target options.
 * @returns The perturbed normal and adjusted UV coordinates.
 */
export function perturbNormal(
    uv: NodeMaterialConnectionPoint,
    positionWorldVec3: NodeMaterialConnectionPoint,
    normalWorldVec3: NodeMaterialConnectionPoint,
    normalTexture: NodeMaterialConnectionPoint,
    bumpStrengthFloat: NodeMaterialConnectionPoint,
    options?: Partial<PerturbNormalOptions>,
): PerturbNormalOutput {
    const perturbedNormal = new PerturbNormalBlock("Perturb normal");
    perturbedNormal.target = options?.target ?? NodeMaterialBlockTargets.Fragment;
    perturbedNormal.useParallaxOcclusion = options?.parallax !== undefined;

    uv.connectTo(perturbedNormal.uv);
    positionWorldVec3.connectTo(perturbedNormal.worldPosition);
    normalWorldVec3.connectTo(perturbedNormal.worldNormal);
    normalTexture.connectTo(perturbedNormal.normalMapColor);
    bumpStrengthFloat.connectTo(perturbedNormal.strength);
    options?.parallax?.scale.connectTo(perturbedNormal.parallaxScale);
    options?.parallax?.viewDirection.connectTo(perturbedNormal.viewDirection);

    return perturbedNormal;
}

export type SubSurfaceScatteringOptions = {
    tintColor: SubSurfaceBlock["tintColor"];
    translucencyIntensity: SubSurfaceBlock["translucencyIntensity"];
    translucencyDiffusionDistance: SubSurfaceBlock["translucencyDiffusionDist"];
    refraction: SubSurfaceBlock["refraction"];
    dispersion: SubSurfaceBlock["dispersion"];
};

/**
 * Creates a fragment shader block for subsurface scattering.
 * @param thickness - Scattering thickness value connected to the subsurface block.
 * @param options - Optional target and subsurface scattering settings.
 * @returns Subsurface scattering connection for the shader graph.
 */
export function subSurfaceScatter(
    thickness: NodeMaterialConnectionPoint,
    options?: Partial<SubSurfaceScatteringOptions>,
): NodeMaterialConnectionPoint {
    const sssBlock = new SubSurfaceBlock("SubSurfaceScattering");
    sssBlock.target = NodeMaterialBlockTargets.Fragment;
    thickness.connectTo(sssBlock.thickness);
    options?.tintColor?.connectTo(sssBlock.tintColor);
    options?.translucencyIntensity?.connectTo(sssBlock.translucencyIntensity);
    options?.translucencyDiffusionDistance?.connectTo(sssBlock.translucencyDiffusionDist);
    options?.refraction?.connectTo(sssBlock.refraction);
    options?.dispersion?.connectTo(sssBlock.dispersion);
    return sssBlock.subsurface;
}

/**
 * Creates PBR reflections from the scene's environment texture.
 * @param positionVec3 - The mesh-local position.
 * @param worldMat4 - The world matrix.
 * @returns The reflection connection for the pbr helper.
 */
export function reflection(
    positionVec3: NodeMaterialConnectionPoint,
    worldMat4: NodeMaterialConnectionPoint,
): NodeMaterialConnectionPoint {
    const reflectionBlock = new ReflectionBlock("Reflection");
    positionVec3.connectTo(reflectionBlock.position);
    worldMat4.connectTo(reflectionBlock.world);
    return reflectionBlock.reflection;
}

export type PBROptions = {
    useEnergyConservation: boolean;
    useRadianceOcclusion: boolean;
    useHorizonOcclusion: boolean;
    albedoRgb: PBRMetallicRoughnessBlock["baseColor"];
    ambientOcclusion: PBRMetallicRoughnessBlock["ambientOcc"];
    opacity: PBRMetallicRoughnessBlock["opacity"];
    perturbedNormal: PBRMetallicRoughnessBlock["perturbedNormal"];
    subSurfaceScattering: PBRMetallicRoughnessBlock["subsurface"];
    reflection: PBRMetallicRoughnessBlock["reflection"];
    lightFalloff: typeof Light.FALLOFF_PHYSICAL | typeof Light.FALLOFF_GLTF | typeof Light.FALLOFF_STANDARD;
};

export type PBROutput = {
    lighting: PBRMetallicRoughnessBlock["lighting"];
    alpha: PBRMetallicRoughnessBlock["alpha"];
    shadow: PBRMetallicRoughnessBlock["shadow"];
};

/**
 * Creates a PBR metallic roughness material using the given parameters.
 * @param metallicFloat - The metallic value.
 * @param roughnessFloat - The roughness value.
 * @param normalWorldVec3 - The world normal vector.
 * @param viewMat4 - The view matrix.
 * @param cameraPositionVec3 - The camera position vector.
 * @param positionWorldVec3 - The world position vector.
 * @param options - Optional properties for the PBR material.
 * @returns Lighting, alpha, and shadow connections from the material block.
 */
export function pbr(
    metallicFloat: NodeMaterialConnectionPoint,
    roughnessFloat: NodeMaterialConnectionPoint,
    normalWorldVec3: NodeMaterialConnectionPoint,
    viewMat4: NodeMaterialConnectionPoint,
    cameraPositionVec3: NodeMaterialConnectionPoint,
    positionWorldVec3: NodeMaterialConnectionPoint,
    options?: Partial<PBROptions>,
): PBROutput {
    const PBRMetallicRoughness = new PBRMetallicRoughnessBlock("PBRMetallicRoughness");
    PBRMetallicRoughness.target = NodeMaterialBlockTargets.VertexAndFragment;
    PBRMetallicRoughness.useEnergyConservation = options?.useEnergyConservation ?? true;
    PBRMetallicRoughness.useRadianceOcclusion = options?.useRadianceOcclusion ?? true;
    PBRMetallicRoughness.useHorizonOcclusion = options?.useHorizonOcclusion ?? true;
    PBRMetallicRoughness.lightFalloff = options?.lightFalloff ?? Light.FALLOFF_GLTF;

    metallicFloat.connectTo(PBRMetallicRoughness.metallic);
    roughnessFloat.connectTo(PBRMetallicRoughness.roughness);
    normalWorldVec3.connectTo(PBRMetallicRoughness.worldNormal);
    viewMat4.connectTo(PBRMetallicRoughness.view);
    cameraPositionVec3.connectTo(PBRMetallicRoughness.cameraPosition);
    positionWorldVec3.connectTo(PBRMetallicRoughness.worldPosition);

    options?.albedoRgb?.connectTo(PBRMetallicRoughness.baseColor);
    options?.ambientOcclusion?.connectTo(PBRMetallicRoughness.ambientOcc);
    options?.opacity?.connectTo(PBRMetallicRoughness.opacity);
    options?.perturbedNormal?.connectTo(PBRMetallicRoughness.perturbedNormal);
    options?.subSurfaceScattering?.connectTo(PBRMetallicRoughness.subsurface);
    options?.reflection?.connectTo(PBRMetallicRoughness.reflection);

    return PBRMetallicRoughness;
}
