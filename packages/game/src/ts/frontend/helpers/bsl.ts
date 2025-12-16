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

/**
 * BSL (Babylon Shader Language) - A utility module for building node-based materials in Babylon.js
 *
 * This module provides a collection of helper functions to create and connect node material blocks
 * in a more functional and concise way. It abstracts away the complexity of manually creating and
 * connecting blocks, making shader creation more intuitive and less error-prone.
 *
 * The functions in this module follow a consistent pattern:
 * - They create the necessary node material blocks
 * - They configure the blocks with the provided options
 * - They handle the connections between blocks
 * - They return the relevant output connection point
 */

import { AddBlock } from "@babylonjs/core/Materials/Node/Blocks/addBlock";
import { ArcTan2Block } from "@babylonjs/core/Materials/Node/Blocks/arcTan2Block";
import { DivideBlock } from "@babylonjs/core/Materials/Node/Blocks/divideBlock";
import { ImageSourceBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { TextureBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/textureBlock";
import { FragmentOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { PerturbNormalBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/perturbNormalBlock";
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { LengthBlock } from "@babylonjs/core/Materials/Node/Blocks/lengthBlock";
import { LerpBlock } from "@babylonjs/core/Materials/Node/Blocks/lerpBlock";
import { MaxBlock } from "@babylonjs/core/Materials/Node/Blocks/maxBlock";
import { MinBlock } from "@babylonjs/core/Materials/Node/Blocks/minBlock";
import { MultiplyBlock } from "@babylonjs/core/Materials/Node/Blocks/multiplyBlock";
import { PBRMetallicRoughnessBlock } from "@babylonjs/core/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock";
import { RemapBlock } from "@babylonjs/core/Materials/Node/Blocks/remapBlock";
import { SmoothStepBlock } from "@babylonjs/core/Materials/Node/Blocks/smoothStepBlock";
import { StepBlock } from "@babylonjs/core/Materials/Node/Blocks/stepBlock";
import { SubtractBlock } from "@babylonjs/core/Materials/Node/Blocks/subtractBlock";
import { TransformBlock } from "@babylonjs/core/Materials/Node/Blocks/transformBlock";
import {
    TrigonometryBlock,
    TrigonometryBlockOperations,
} from "@babylonjs/core/Materials/Node/Blocks/trigonometryBlock";
import { TriPlanarBlock } from "@babylonjs/core/Materials/Node/Blocks/triPlanarBlock";
import { VectorMergerBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorMergerBlock";
import { VectorSplitterBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorSplitterBlock";
import { InstancesBlock } from "@babylonjs/core/Materials/Node/Blocks/Vertex/instancesBlock";
import { VertexOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { ViewDirectionBlock } from "@babylonjs/core/Materials/Node/Blocks/viewDirectionBlock";
import { NodeMaterialBlockConnectionPointTypes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { NodeMaterialSystemValues } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialSystemValues";
import { type NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Vector2, type Vector3, type Vector4 } from "@babylonjs/core/Maths/math.vector";

export const Target = {
    VERT: NodeMaterialBlockTargets.Vertex,
    FRAG: NodeMaterialBlockTargets.Fragment,
    NEUTRAL: NodeMaterialBlockTargets.Neutral,
    VERT_AND_FRAG: NodeMaterialBlockTargets.VertexAndFragment,
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
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const attribute = new InputBlock(name);
    attribute.target = options?.target ?? NodeMaterialBlockTargets.Vertex;
    attribute.setAsAttribute(name);

    return attribute.output;
}

export type InstanceAttributeName = "world0" | "world1" | "world2" | "world3";

export function instanceAttribute(name: InstanceAttributeName, options?: Partial<TargetOptions>) {
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

export function f(value: number, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return float(value, options);
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
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock(name);
    inputBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    inputBlock.value = value;
    inputBlock.matrixMode = 0;

    return inputBlock.output;
}

export function getViewDirection(
    worldPosition: NodeMaterialConnectionPoint,
    cameraPosition: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const viewDirection = new ViewDirectionBlock("viewDirection");
    viewDirection.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    worldPosition.connectTo(viewDirection.worldPosition);
    cameraPosition.connectTo(viewDirection.cameraPosition);

    return viewDirection.output;
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
    options?: Partial<TextureBlockOptions>,
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

export type UniformTexture2d = {
    source: ImageSourceBlock["source"];
    dimensions: ImageSourceBlock["dimensions"];
};

export function uniformTexture2d(texture: Texture, options?: Partial<TargetOptions>): UniformTexture2d {
    const imageSourceBlock = new ImageSourceBlock(`${texture.name}SourceBlock`);
    imageSourceBlock.target = options?.target ?? Target.VERT_AND_FRAG;
    imageSourceBlock.texture = texture;

    return imageSourceBlock;
}

export type TriPlanarSampleOptions = TargetOptions & {
    sharpness: NodeMaterialConnectionPoint;
    convertToLinearSpace: boolean;
    convertToGammaSpace: boolean;
};

/**
 * Samples a texture using triplanar mapping based on the position and normal.
 * @param texture - The texture to sample.
 * @param position - The world position.
 * @param normal - The world normal.
 * @param options - Optional properties for the triplanar sampling.
 */
export function textureTriPlanarSample(
    texture: Texture,
    position: NodeMaterialConnectionPoint,
    normal: NodeMaterialConnectionPoint,
    options?: Partial<TriPlanarSampleOptions>,
) {
    const triPlanarBlock = new TriPlanarBlock("TriPlanar");
    triPlanarBlock.texture = texture;

    triPlanarBlock.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    triPlanarBlock.convertToLinearSpace = options?.convertToLinearSpace ?? false;

    position.connectTo(triPlanarBlock.position);
    normal.connectTo(triPlanarBlock.normal);

    options?.sharpness?.connectTo(triPlanarBlock.sharpness);

    return triPlanarBlock;
}

export function triPlanarMapping(
    textures: [NodeMaterialConnectionPoint?, NodeMaterialConnectionPoint?, NodeMaterialConnectionPoint?],
    position: NodeMaterialConnectionPoint,
    normal: NodeMaterialConnectionPoint,
    options?: Partial<TriPlanarSampleOptions>,
) {
    const triPlanarBlock = new TriPlanarBlock("TriPlanar");

    textures[0]?.connectTo(triPlanarBlock.source);
    textures[1]?.connectTo(triPlanarBlock.sourceY);
    if (triPlanarBlock.sourceZ !== null) {
        textures[2]?.connectTo(triPlanarBlock.sourceZ);
    }

    triPlanarBlock.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    triPlanarBlock.convertToLinearSpace = options?.convertToLinearSpace ?? false;

    position.connectTo(triPlanarBlock.position);
    normal.connectTo(triPlanarBlock.normal);

    options?.sharpness?.connectTo(triPlanarBlock.sharpness);

    return triPlanarBlock;
}

export type InstanceData = {
    output: NodeMaterialConnectionPoint;
    instanceID: NodeMaterialConnectionPoint;
};

export function getInstanceData(
    world0: NodeMaterialConnectionPoint,
    world1: NodeMaterialConnectionPoint,
    world2: NodeMaterialConnectionPoint,
    world3: NodeMaterialConnectionPoint,
    world: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): InstanceData {
    const instancesBlock = new InstancesBlock("Instances");
    instancesBlock.target = options?.target ?? NodeMaterialBlockTargets.Vertex;

    world0.connectTo(instancesBlock.world0);
    world1.connectTo(instancesBlock.world1);
    world2.connectTo(instancesBlock.world2);
    world3.connectTo(instancesBlock.world3);
    world.connectTo(instancesBlock.world);

    return instancesBlock;
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
    options?: Partial<TargetOptions>,
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
    options?: Partial<TargetOptions>,
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
 * Returns a trigonometry operation on the input value.
 * @param input - The input value.
 * @param operation - The trigonometry operation to perform.
 * @param options - Optional target options.
 */
export function trig(
    input: NodeMaterialConnectionPoint,
    operation: TrigonometryBlockOperations,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const trigBlock = new TrigonometryBlock("trig");
    trigBlock.operation = operation;
    trigBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    input.connectTo(trigBlock.input);

    return trigBlock.output;
}

/**
 * Returns the arctangent of y/x using the signs of the arguments to determine the quadrant.
 * @param x - The x coordinate.
 * @param y - The y coordinate.
 * @param options - Optional target options.
 */
export function atan2(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const atan2Block = new ArcTan2Block("atan2");
    atan2Block.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    x.connectTo(atan2Block.x);
    y.connectTo(atan2Block.y);

    return atan2Block.output;
}

/**
 * Returns the length (magnitude) of a vector.
 * @param input - The input vector.
 * @param options - Optional target options.
 */
export function length(
    input: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const lengthBlock = new LengthBlock("length");
    lengthBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    input.connectTo(lengthBlock.value);

    return lengthBlock.output;
}

/**
 * Remaps a value from one range to another.
 * @param input - The input value to remap.
 * @param sourceMin - The minimum value of the source range.
 * @param sourceMax - The maximum value of the source range.
 * @param targetMin - The minimum value of the target range.
 * @param targetMax - The maximum value of the target range.
 * @param options - Optional target options.
 */
export function remap(
    input: NodeMaterialConnectionPoint,
    sourceMin: NodeMaterialConnectionPoint,
    sourceMax: NodeMaterialConnectionPoint,
    targetMin: NodeMaterialConnectionPoint,
    targetMax: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const remapBlock = new RemapBlock("remap");
    remapBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    input.connectTo(remapBlock.input);
    sourceMin.connectTo(remapBlock.sourceMin);
    sourceMax.connectTo(remapBlock.sourceMax);
    targetMin.connectTo(remapBlock.targetMin);
    targetMax.connectTo(remapBlock.targetMax);

    return remapBlock.output;
}

/**
 * Returns the fractional part of the input value.
 * @param input - The input value.
 * @param options - Optional target options.
 */
export function fract(
    input: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
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
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const mulBlock = new MultiplyBlock("mul");
    mulBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(mulBlock.left);
    right.connectTo(mulBlock.right);

    return mulBlock.output;
}

/**
 * Divides the left value by the right value.
 * @param left - The dividend value.
 * @param right - The divisor value.
 * @param options - Optional target options.
 * @returns The division result as a connection point.
 */
export function div(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const mulBlock = new DivideBlock("div");
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
    options?: Partial<TargetOptions>,
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
 * Replaces the X component of a vector with a new value.
 * @param input - The input vector.
 * @param x - The new X component.
 * @param options - Optional target options.
 */
export function withX(
    input: NodeMaterialConnectionPoint,
    x: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const splitInput = split(input, options);
    return merge(x, splitInput.y, splitInput.z, splitInput.w, options);
}

/**
 * Replaces the Y component of a vector with a new value.
 * @param input - The input vector.
 * @param y - The new Y component.
 * @param options - Optional target options.
 */
export function withY(
    input: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const splitInput = split(input, options);
    return merge(splitInput.x, y, splitInput.z, splitInput.w, options);
}

/**
 * Replaces the Z component of a vector with a new value.
 * @param input - The input vector.
 * @param z - The new Z component.
 * @param options - Optional target options.
 */
export function withZ(
    input: NodeMaterialConnectionPoint,
    z: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const splitInput = split(input, options);
    return merge(splitInput.x, splitInput.y, z, splitInput.w, options);
}

/**
 * Replaces the W component of a vector with a new value.
 * @param input - The input vector.
 * @param w - The new W component.
 * @param options - Optional target options.
 */
export function withW(
    input: NodeMaterialConnectionPoint,
    w: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const splitInput = split(input, options);
    return merge(splitInput.x, splitInput.y, splitInput.z, w, options);
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
    options?: Partial<TargetOptions>,
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
    options?: Partial<TargetOptions>,
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
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    return merge(x, y, z, w, options).xyzw;
}

/**
 * Splits a vec2/3/4 into its components.
 * @param inputVec - The input vec.
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
 * Creates a vec2 using the input vector's X and Z components.
 * Useful for projecting 3D positions onto a 2D plane.
 * @param inputVec - The input vector (must be vec3 or vec4).
 * @param options - Optional target options.
 * @returns A vec2 containing the X and Z components.
 */
export function xz(
    inputVec: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const inputSplitted = split(inputVec, options);

    const outputXZ = new VectorMergerBlock("OutputXZ");
    outputXZ.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    inputSplitted.x.connectTo(outputXZ.x);
    inputSplitted.z.connectTo(outputXZ.y);

    return outputXZ.xyOut;
}

/**
 * Returns the step function: 0 if x < edge, 1 if x >= edge
 * @param edge - The edge value.
 * @param x - The input value.
 * @param options - Optional target options.
 */
export function step(
    edge: NodeMaterialConnectionPoint,
    x: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const stepBlock = new StepBlock("step");
    stepBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    edge.connectTo(stepBlock.edge);
    x.connectTo(stepBlock.value);

    return stepBlock.output;
}

/**
 * Returns the smooth step function result.
 * The return value is 0.0 if x <= edge0, 1.0 if x >= edge1,
 * and performs smooth Hermite interpolation between 0.0 and 1.0 when edge0 < x < edge1.
 * @param edge0 - The lower edge of the Hermite function.
 * @param edge1 - The upper edge of the Hermite function.
 * @param x - The source value for interpolation.
 * @param options - Optional target options.
 * @returns The smoothly interpolated value.
 */
export function smoothstep(
    edge0: NodeMaterialConnectionPoint,
    edge1: NodeMaterialConnectionPoint,
    x: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const stepBlock = new SmoothStepBlock("smoothstep");
    stepBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    edge0.connectTo(stepBlock.edge0);
    edge1.connectTo(stepBlock.edge1);
    x.connectTo(stepBlock.value);

    return stepBlock.output;
}

/**
 * Returns the absolute value of the input.
 * @param input - The input value.
 * @param options - Optional target options.
 */
export function abs(input: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>) {
    const absBlock = new TrigonometryBlock("abs");
    absBlock.operation = TrigonometryBlockOperations.Abs;
    absBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    input.connectTo(absBlock.input);

    return absBlock.output;
}

/**
 * Linearly interpolates between two values based on a gradient factor.
 * @param x - The first value.
 * @param y - The second value.
 * @param a - The gradient factor (0-1).
 * @param options - Optional target options.
 */
export function mix(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    a: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const mixBlock = new LerpBlock("mix");
    mixBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    x.connectTo(mixBlock.left);
    y.connectTo(mixBlock.right);
    a.connectTo(mixBlock.gradient);

    return mixBlock.output;
}

/**
 * Adds two values together.
 * @param left - The first value to add.
 * @param right - The second value to add.
 * @param options - Optional target options.
 * @returns The sum as a connection point.
 */
export function add(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const addBlock = new AddBlock("add");
    addBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(addBlock.left);
    right.connectTo(addBlock.right);

    return addBlock.output;
}

/**
 * Subtracts the right value from the left value.
 * @param left - The left value.
 * @param right - The right value to subtract.
 * @param options - Optional target options.
 */
export function sub(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const subBlock = new SubtractBlock("sub");
    subBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(subBlock.left);
    right.connectTo(subBlock.right);

    return subBlock.output;
}

/**
 * Returns the minimum of two values.
 * @param left - The first value to compare.
 * @param right - The second value to compare.
 * @param options - Optional target options.
 * @returns The minimum value as a connection point.
 */
export function min(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const minBlock = new MinBlock("min");
    minBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(minBlock.left);
    right.connectTo(minBlock.right);

    return minBlock.output;
}

/**
 * Returns the maximum of two values.
 * @param left - The first value to compare.
 * @param right - The second value to compare.
 * @param options - Optional target options.
 * @returns The maximum value as a connection point.
 */
export function max(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
) {
    const maxBlock = new MaxBlock("max");
    maxBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(maxBlock.left);
    right.connectTo(maxBlock.right);

    return maxBlock.output;
}

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

export type PBROptions = TargetOptions & {
    useEnergyConservation: boolean;
    useRadianceOcclusion: boolean;
    useHorizonOcclusion: boolean;
    albedoRgb: NodeMaterialConnectionPoint;
    ambientOcclusion: NodeMaterialConnectionPoint;
    opacity: NodeMaterialConnectionPoint;
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
 * @param perturbedNormalVec3 - The perturbed normal vector.
 * @param normalWorldVec3 - The world normal vector.
 * @param viewMat4 - The view matrix.
 * @param cameraPositionVec3 - The camera position vector.
 * @param positionWorldVec3 - The world position vector.
 * @param options - Optional properties for the PBR material.
 */
export function pbr(
    metallicFloat: NodeMaterialConnectionPoint,
    roughnessFloat: NodeMaterialConnectionPoint,
    perturbedNormalVec3: NodeMaterialConnectionPoint,
    normalWorldVec3: NodeMaterialConnectionPoint,
    viewMat4: NodeMaterialConnectionPoint,
    cameraPositionVec3: NodeMaterialConnectionPoint,
    positionWorldVec3: NodeMaterialConnectionPoint,
    options?: Partial<PBROptions>,
): PBROutput {
    const PBRMetallicRoughness = new PBRMetallicRoughnessBlock("PBRMetallicRoughness");
    PBRMetallicRoughness.target = options?.target ?? NodeMaterialBlockTargets.Fragment;
    PBRMetallicRoughness.useEnergyConservation = options?.useEnergyConservation ?? true;
    PBRMetallicRoughness.useRadianceOcclusion = options?.useRadianceOcclusion ?? true;
    PBRMetallicRoughness.useHorizonOcclusion = options?.useHorizonOcclusion ?? true;

    metallicFloat.connectTo(PBRMetallicRoughness.metallic);
    roughnessFloat.connectTo(PBRMetallicRoughness.roughness);
    perturbedNormalVec3.connectTo(PBRMetallicRoughness.perturbedNormal);
    normalWorldVec3.connectTo(PBRMetallicRoughness.worldNormal);
    viewMat4.connectTo(PBRMetallicRoughness.view);
    cameraPositionVec3.connectTo(PBRMetallicRoughness.cameraPosition);
    positionWorldVec3.connectTo(PBRMetallicRoughness.worldPosition);

    options?.albedoRgb?.connectTo(PBRMetallicRoughness.baseColor);
    options?.ambientOcclusion?.connectTo(PBRMetallicRoughness.ambientOcc);
    options?.opacity?.connectTo(PBRMetallicRoughness.opacity);

    return PBRMetallicRoughness;
}

export type OutputFragColorOptions = {
    convertToLinearSpace: boolean;
    convertToGammaSpace: boolean;
    alpha: NodeMaterialConnectionPoint;
};

/**
 * Outputs the fragment color using the given parameters.
 * @param colorRgb - The color.
 * @param options - Optional properties for the fragment output block.
 */
export function outputFragColor(
    colorRgb: NodeMaterialConnectionPoint,
    options?: Partial<OutputFragColorOptions>,
): FragmentOutputBlock {
    const FragmentOutput = new FragmentOutputBlock("FragmentOutput");
    FragmentOutput.target = NodeMaterialBlockTargets.Fragment;
    FragmentOutput.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    FragmentOutput.convertToLinearSpace = options?.convertToLinearSpace ?? false;

    colorRgb.connectTo(FragmentOutput.rgb);
    options?.alpha?.connectTo(FragmentOutput.a);

    return FragmentOutput;
}

/**
 * Outputs the vertex position using the given parameters.
 * @param positionVec4 - The position vector.
 * @param options - Optional target options.
 */
export function outputVertexPosition(
    positionVec4: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): VertexOutputBlock {
    const VertexOutput = new VertexOutputBlock("VertexOutput");
    VertexOutput.target = options?.target ?? NodeMaterialBlockTargets.Vertex;

    positionVec4.connectTo(VertexOutput.vector);

    return VertexOutput;
}
