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

import { TextureBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/textureBlock";
import { FragmentOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { PerturbNormalBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/perturbNormalBlock";
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { MultiplyBlock } from "@babylonjs/core/Materials/Node/Blocks/multiplyBlock";
import { PBRMetallicRoughnessBlock } from "@babylonjs/core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { TransformBlock } from "@babylonjs/core/Materials/Node/Blocks/transformBlock";
import {
    TrigonometryBlock,
    TrigonometryBlockOperations
} from "@babylonjs/core/Materials/Node/Blocks/trigonometryBlock";
import { VectorMergerBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorMergerBlock";
import { VectorSplitterBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorSplitterBlock";
import { VertexOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { NodeMaterialSystemValues } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialSystemValues";
import { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector2, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";

export const Target = {
    VERT: NodeMaterialBlockTargets.Vertex,
    FRAG: NodeMaterialBlockTargets.Fragment,
    NEUTRAL: NodeMaterialBlockTargets.Neutral,
    VERT_AND_FRAG: NodeMaterialBlockTargets.VertexAndFragment
};

export type TargetOptions = {
    target: NodeMaterialBlockTargets;
};

/**
 * Returns the camera position as a uniform input block.
 * @param options - Optional target options.
 */
export function uniformCameraPosition(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const cameraPosition = new InputBlock("cameraPosition");
    cameraPosition.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    cameraPosition.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);

    return cameraPosition.output;
}

/**
 * Returns the view matrix as a uniform input block.
 * @param options - Optional target options.
 */
export function uniformView(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const view = new InputBlock("view");
    view.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    view.setAsSystemValue(NodeMaterialSystemValues.View);

    return view.output;
}

/**
 * Returns the view projection matrix as a uniform input block.
 * @param options - Optional target options.
 */
export function uniformViewProjection(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const ViewProjection = new InputBlock("ViewProjection");
    ViewProjection.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    ViewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);

    return ViewProjection.output;
}

/**
 * Returns the world matrix as a uniform input block.
 * @param options - Optional target options.
 */
export function uniformWorld(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const world = new InputBlock("world");
    world.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    world.setAsSystemValue(NodeMaterialSystemValues.World);

    return world.output;
}

export type VertexAttributeName =
    | "position"
    | "normal"
    | "tangent"
    | "uv"
    | "uv2"
    | "matricesIndices"
    | "matricesWeights"
    | "matricesIndicesExtra"
    | "matricesWeightsExtra";

/**
 * Returns a vertex attribute input block for the given attribute name.
 * @param name - The name of the vertex attribute.
 * @param options - Optional target options.
 */
export function vertexAttribute(
    name: VertexAttributeName,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const attribute = new InputBlock(name);
    attribute.target = options?.target ?? NodeMaterialBlockTargets.Vertex;
    attribute.setAsAttribute(name);

    return attribute.output;
}

/**
 * Returns a float input block with the given value.
 * @param value - The float value.
 * @param options - Optional target options.
 */
export function float(value: number, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock("float");
    inputBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    inputBlock.value = value;
    inputBlock.isConstant = true;

    return inputBlock.output;
}

/**
 * Returns a constant float input block with the given name and value.
 * @param name - The name of the input block.
 * @param value - The float value.
 * @param options - Optional target options.
 */
export function constFloat(name: string, value: number, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock(name);
    inputBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    inputBlock.value = value;
    inputBlock.isConstant = true;

    return inputBlock.output;
}

/**
 * Returns a uniform float input block with the given name and value.
 * @param name - The name of the input block.
 * @param value - The float value.
 * @param options - Optional target options.
 */
export function uniformFloat(
    name: string,
    value: number,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock(name);
    inputBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    inputBlock.value = value;
    inputBlock.matrixMode = 0;

    return inputBlock.output;
}

export type TextureBlockOptions = TargetOptions & {
    convertToLinearSpace: boolean;
    convertToGammaSpace: boolean;
    disableLevelMultiplication: boolean;
};

/**
 * Samples a texture using the given UV coordinates and optional properties.
 * @param texture - The texture to sample.
 * @param uv - The UV coordinates.
 * @param options - Optional properties for the texture block.
 */
export function textureSample(
    texture: Texture,
    uv: NodeMaterialConnectionPoint,
    options?: Partial<TextureBlockOptions>
) {
    const textureBlock = new TextureBlock("texture");
    textureBlock.target = options?.target ?? NodeMaterialBlockTargets.Fragment;
    textureBlock.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    textureBlock.convertToLinearSpace = options?.convertToLinearSpace ?? false;
    textureBlock.disableLevelMultiplication = options?.disableLevelMultiplication ?? false;
    textureBlock.texture = texture;

    uv.connectTo(textureBlock.uv);

    return textureBlock;
}

/**
 * Transforms a position vector using the given transformation matrix.
 * @param transformMat4 - The transformation matrix.
 * @param positionVec3 - The position vector.
 * @param options - Optional target options.
 */
export function transformPosition(
    transformMat4: NodeMaterialConnectionPoint,
    positionVec3: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const transformBlock = new TransformBlock("TransformPosition");
    transformBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    transformBlock.complementZ = 0;
    transformBlock.complementW = 1;

    positionVec3.connectTo(transformBlock.vector);
    transformMat4.connectTo(transformBlock.transform);

    return transformBlock.output;
}

/**
 * Transforms a direction vector using the given transformation matrix.
 * @param transformMat4 - The transformation matrix.
 * @param directionVec3 - The direction vector.
 * @param options - Optional target options.
 */
export function transformDirection(
    transformMat4: NodeMaterialConnectionPoint,
    directionVec3: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const transformBlock = new TransformBlock("TransformDirection");
    transformBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    transformBlock.complementZ = 0;
    transformBlock.complementW = 0;

    directionVec3.connectTo(transformBlock.vector);
    transformMat4.connectTo(transformBlock.transform);

    return transformBlock.output;
}

/**
 * Returns the fractional part of the input value.
 * @param input - The input value.
 * @param options - Optional target options.
 */
export function fract(
    input: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const fractBlock = new TrigonometryBlock("fract");
    fractBlock.operation = TrigonometryBlockOperations.Fract;
    fractBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    input.connectTo(fractBlock.input);

    return fractBlock.output;
}

/**
 * Multiplies two values (vector / vector or float / float or any other combination).
 * @param left - The left vector.
 * @param right - The right vector.
 * @param options - Optional target options.
 */
export function mul(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const mulBlock = new MultiplyBlock("mul");
    mulBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(mulBlock.left);
    right.connectTo(mulBlock.right);

    return mulBlock.output;
}

/**
 * Merges the given components into a vector.
 * @param x - The x component.
 * @param y - The y component.
 * @param z - The z component (optional).
 * @param w - The w component (optional).
 * @param options - Optional target options.
 */
export function merge(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    z: NodeMaterialConnectionPoint | null,
    w: NodeMaterialConnectionPoint | null,
    options?: Partial<TargetOptions>
) {
    const merger = new VectorMergerBlock("Merge");
    merger.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    x.connectTo(merger.x);
    y.connectTo(merger.y);

    if (z) {
        z.connectTo(merger.z);
    }

    if (w) {
        w.connectTo(merger.w);
    }

    return merger;
}

/**
 * Converts a Babylon.js vector to a node material input block.
 * @param vec - The Babylon.js vector.
 * @param options - Optional target options.
 */
export function vec(vec: Vector2 | Vector3 | Vector4, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const vector = new InputBlock("Mesh UV scale factor");
    vector.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    vector.isConstant = true;
    vector.value = vec;

    return vector.output;
}

/**
 * Creates a vec2 from the given components.
 * @param x - The x component.
 * @param y - The y component.
 * @param options - Optional target options.
 */
export function vec2(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    return merge(x, y, null, null, options).xyOut;
}

/**
 * Creates a vec3 from the given components.
 * @param x - The x component.
 * @param y - The y component.
 * @param z - The z component.
 * @param options - Optional target options.
 */
export function vec3(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    z: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    return merge(x, y, z, null, options).xyzOut;
}

/**
 * Creates a vec4 from the given components.
 * @param x - The x component.
 * @param y - The y component.
 * @param z - The z component.
 * @param w - The w component.
 * @param options - Optional target options.
 */
export function vec4(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    z: NodeMaterialConnectionPoint,
    w: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    return merge(x, y, z, w, options).xyzw;
}

/**
 * Splits a vec2/3/4 into its components.
 * @param inputVec - The input vec.
 * @param dim - The dimension of the input vector
 * @param options - Optional target options.
 */
export function split(inputVec: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): VectorSplitterBlock {
    const splitBlock = new VectorSplitterBlock("split");
    splitBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    switch (inputVec.type) {
        case NodeMaterialBlockConnectionPointTypes.Float:
        case NodeMaterialBlockConnectionPointTypes.Int:
        case NodeMaterialBlockConnectionPointTypes.Matrix:
        case NodeMaterialBlockConnectionPointTypes.Object:
        case NodeMaterialBlockConnectionPointTypes.AutoDetect:
        case NodeMaterialBlockConnectionPointTypes.BasedOnInput:
        case NodeMaterialBlockConnectionPointTypes.All:
            throw new Error("Invalid input type");
        case NodeMaterialBlockConnectionPointTypes.Vector2:
            inputVec.connectTo(splitBlock.xyIn);
            break;
        case NodeMaterialBlockConnectionPointTypes.Vector3:
        case NodeMaterialBlockConnectionPointTypes.Color3:
            inputVec.connectTo(splitBlock.xyzIn);
            break;
        case NodeMaterialBlockConnectionPointTypes.Vector4:
        case NodeMaterialBlockConnectionPointTypes.Color4:
            inputVec.connectTo(splitBlock.xyzw);
            break;
    }

    return splitBlock;
}

/**
 * Returns the xz components of a vec3 / 4.
 * @param inputVec3 - The input vec3 / 4.
 * @param dim - The dimension of the input vector
 * @param options - Optional target options.
 */
export function xz(
    inputVec: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const inputSplitted = split(inputVec, options);

    const outputXZ = new VectorMergerBlock("OutputXZ");
    outputXZ.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    inputSplitted.x.connectTo(outputXZ.x);
    inputSplitted.z.connectTo(outputXZ.y);

    return outputXZ.xyOut;
}

/**
 * Perturbs the normal vector using the given parameters.
 * @param uv - The UV coordinates.
 * @param positionWorldVec3 - The world position vector.
 * @param normalWorldVec3 - The world normal vector.
 * @param normalTexture - The normal texture.
 * @param bumpStrengthFloat - The bump strength.
 * @param options - Optional target options.
 */
export function perturbNormal(
    uv: NodeMaterialConnectionPoint,
    positionWorldVec3: NodeMaterialConnectionPoint,
    normalWorldVec3: NodeMaterialConnectionPoint,
    normalTexture: NodeMaterialConnectionPoint,
    bumpStrengthFloat: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): NodeMaterialConnectionPoint {
    const perturbedNormal = new PerturbNormalBlock("Perturb normal");
    perturbedNormal.target = options?.target ?? NodeMaterialBlockTargets.Fragment;

    uv.connectTo(perturbedNormal.uv);
    positionWorldVec3.connectTo(perturbedNormal.worldPosition);
    normalWorldVec3.connectTo(perturbedNormal.worldNormal);
    normalTexture.connectTo(perturbedNormal.normalMapColor);
    bumpStrengthFloat.connectTo(perturbedNormal.strength);

    return perturbedNormal.output;
}

export type PBRMetallicRoughnessMaterialOptions = TargetOptions & {
    useEnergyConservation: boolean;
    useRadianceOcclusion: boolean;
    useHorizonOcclusion: boolean;
};

/**
 * Creates a PBR metallic roughness material using the given parameters.
 * @param albedoRgb - The albedo color.
 * @param metallicFloat - The metallic value.
 * @param roughnessFloat - The roughness value.
 * @param ambientOcclusionFloat - The ambient occlusion value (optional).
 * @param perturbedNormalVec3 - The perturbed normal vector.
 * @param normalWorldVec3 - The world normal vector.
 * @param viewMat4 - The view matrix.
 * @param cameraPositionVec3 - The camera position vector.
 * @param positionWorldVec3 - The world position vector.
 * @param options - Optional properties for the PBR material.
 */
export function pbrMetallicRoughnessMaterial(
    albedoRgb: NodeMaterialConnectionPoint,
    metallicFloat: NodeMaterialConnectionPoint,
    roughnessFloat: NodeMaterialConnectionPoint,
    ambientOcclusionFloat: NodeMaterialConnectionPoint | null,
    perturbedNormalVec3: NodeMaterialConnectionPoint,
    normalWorldVec3: NodeMaterialConnectionPoint,
    viewMat4: NodeMaterialConnectionPoint,
    cameraPositionVec3: NodeMaterialConnectionPoint,
    positionWorldVec3: NodeMaterialConnectionPoint,
    options?: Partial<PBRMetallicRoughnessMaterialOptions>
): NodeMaterialConnectionPoint {
    const PBRMetallicRoughness = new PBRMetallicRoughnessBlock("PBRMetallicRoughness");
    PBRMetallicRoughness.target = options?.target ?? NodeMaterialBlockTargets.Fragment;
    PBRMetallicRoughness.useEnergyConservation = options?.useEnergyConservation ?? true;
    PBRMetallicRoughness.useRadianceOcclusion = options?.useRadianceOcclusion ?? true;
    PBRMetallicRoughness.useHorizonOcclusion = options?.useHorizonOcclusion ?? true;

    albedoRgb.connectTo(PBRMetallicRoughness.baseColor);
    metallicFloat.connectTo(PBRMetallicRoughness.metallic);
    roughnessFloat.connectTo(PBRMetallicRoughness.roughness);
    ambientOcclusionFloat?.connectTo(PBRMetallicRoughness.ambientOcc);
    perturbedNormalVec3.connectTo(PBRMetallicRoughness.perturbedNormal);
    normalWorldVec3.connectTo(PBRMetallicRoughness.worldNormal);
    viewMat4.connectTo(PBRMetallicRoughness.view);
    cameraPositionVec3.connectTo(PBRMetallicRoughness.cameraPosition);
    positionWorldVec3.connectTo(PBRMetallicRoughness.worldPosition);

    return PBRMetallicRoughness.lighting;
}

export type OutputFragColorOptions = {
    convertToLinearSpace: boolean;
    convertToGammaSpace: boolean;
};

/**
 * Outputs the fragment color using the given parameters.
 * @param colorRgb - The color.
 * @param options - Optional properties for the fragment output block.
 */
export function outputFragColor(
    colorRgb: NodeMaterialConnectionPoint,
    options?: Partial<OutputFragColorOptions>
): FragmentOutputBlock {
    const FragmentOutput = new FragmentOutputBlock("FragmentOutput");
    FragmentOutput.target = NodeMaterialBlockTargets.Fragment;
    FragmentOutput.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    FragmentOutput.convertToLinearSpace = options?.convertToLinearSpace ?? false;

    colorRgb.connectTo(FragmentOutput.rgb);

    return FragmentOutput;
}

/**
 * Outputs the vertex position using the given parameters.
 * @param positionVec4 - The position vector.
 * @param options - Optional target options.
 */
export function outputVertexPosition(
    positionVec4: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>
): VertexOutputBlock {
    const VertexOutput = new VertexOutputBlock("VertexOutput");
    VertexOutput.target = options?.target ?? NodeMaterialBlockTargets.Vertex;

    positionVec4.connectTo(VertexOutput.vector);

    return VertexOutput;
}
