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

import { CrossBlock } from "@babylonjs/core/Materials/Node/Blocks/crossBlock";
import { DistanceBlock } from "@babylonjs/core/Materials/Node/Blocks/distanceBlock";
import { DotBlock } from "@babylonjs/core/Materials/Node/Blocks/dotBlock";
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { LengthBlock } from "@babylonjs/core/Materials/Node/Blocks/lengthBlock";
import { NormalizeBlock } from "@babylonjs/core/Materials/Node/Blocks/normalizeBlock";
import { VectorMergerBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorMergerBlock";
import { VectorSplitterBlock } from "@babylonjs/core/Materials/Node/Blocks/vectorSplitterBlock";
import { NodeMaterialBlockConnectionPointTypes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import type { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";

import { float } from "./f32";
import { sub, mul, add } from "./math";
import type { TargetOptions } from "./target";
import { cos, sin } from "./trigonometry";

/**
 * @param inputVector - Babylon.js vector value.
 * @param options - Optional target options.
 * @returns The vector value as a shader input connection.
 */
export function vec(
    inputVector: Vector2 | Vector3 | Vector4,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const vector = new InputBlock("Mesh UV scale factor");
    vector.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    vector.isConstant = true;
    vector.value = inputVector;

    return vector.output;
}

/**
 * @param x - The x component.
 * @param y - The y component.
 * @param options - Optional target options.
 * @returns The composed vec2 as a shader expression.
 */
export function vec2(
    x: NodeMaterialConnectionPoint,
    y: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    return merge({ x, y }, options).xyOut;
}

type Vec3Input = Partial<{
    xyz: NodeMaterialConnectionPoint;
    xy: NodeMaterialConnectionPoint;
    x: NodeMaterialConnectionPoint;
    y: NodeMaterialConnectionPoint;
    z: NodeMaterialConnectionPoint;
}>;

/**
 * @param inputs - The components to merge into a vec3 (x, y, z or xy, z or xyz).
 * @param options - Optional target options.
 * @returns The composed vec3 as a shader expression.
 */
export function vec3(inputs: Vec3Input, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return merge(inputs, options).xyzOut;
}

/**
 * @param inputs - The components to merge into a vec4 (x, y, z, w or xy, z, w or xyz, w or xyzw).
 * @param options - Optional target options.
 * @returns The composed vec4 as a shader expression.
 */
export function vec4(inputs: MergeInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return merge(inputs, options).xyzw;
}

type MergeInput = Partial<{
    xyzw: NodeMaterialConnectionPoint;
    xyz: NodeMaterialConnectionPoint;
    xy: NodeMaterialConnectionPoint;
    zw: NodeMaterialConnectionPoint;
    x: NodeMaterialConnectionPoint;
    y: NodeMaterialConnectionPoint;
    z: NodeMaterialConnectionPoint;
    w: NodeMaterialConnectionPoint;
}>;

type MergeOutput = {
    xyzw: VectorMergerBlock["xyzw"];
    xyzOut: VectorMergerBlock["xyzOut"];
    xyOut: VectorMergerBlock["xyOut"];
    zwOut: VectorMergerBlock["zwOut"];
};

/**
 * Merges the given components into a vector.
 * @param inputs - The components to merge (x, y, z, w or xy, zw or xyz, xyzw).
 * @param options - Optional target options.
 * @returns The merged vector component outputs.
 */
export function merge(inputs: MergeInput, options?: Partial<TargetOptions>): MergeOutput {
    const merger = new VectorMergerBlock("Merge");
    merger.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    inputs.xyzw?.connectTo(merger.xyzwIn);
    inputs.xyz?.connectTo(merger.xyzIn);
    inputs.xy?.connectTo(merger.xyIn);
    inputs.zw?.connectTo(merger.zwIn);
    inputs.x?.connectTo(merger.x);
    inputs.y?.connectTo(merger.y);
    inputs.z?.connectTo(merger.z);
    inputs.w?.connectTo(merger.w);

    return merger;
}

type SwizzleComponent = "x" | "y" | "z" | "w";

type SwizzleString =
    | `${SwizzleComponent}${SwizzleComponent}`
    | `${SwizzleComponent}${SwizzleComponent}${SwizzleComponent}`
    | `${SwizzleComponent}${SwizzleComponent}${SwizzleComponent}${SwizzleComponent}`;

/**
 * @param input - The input vector.
 * @param swizzleStr - The component order to produce.
 * @param options - Optional target options.
 * @returns Components reordered by `swizzleStr` as a shader expression.
 */
export function swizzle(
    input: NodeMaterialConnectionPoint,
    swizzleStr: SwizzleString,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const swizzleBlock = new VectorMergerBlock("Swizzle");
    swizzleBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    if (input.canConnectTo(swizzleBlock.xyzwIn)) {
        input.connectTo(swizzleBlock.xyzwIn);
    } else if (input.canConnectTo(swizzleBlock.xyzIn)) {
        input.connectTo(swizzleBlock.xyzIn);
    } else if (input.canConnectTo(swizzleBlock.xyIn)) {
        input.connectTo(swizzleBlock.xyIn);
    } else {
        throw new Error("Input type is not compatible with swizzle block");
    }

    if (swizzleStr[0] !== undefined) {
        swizzleBlock.xSwizzle = swizzleStr[0] as SwizzleComponent;
    }
    if (swizzleStr[1] !== undefined) {
        swizzleBlock.ySwizzle = swizzleStr[1] as SwizzleComponent;
    }
    if (swizzleStr[2] !== undefined) {
        swizzleBlock.zSwizzle = swizzleStr[2] as SwizzleComponent;
    }
    if (swizzleStr[3] !== undefined) {
        swizzleBlock.wSwizzle = swizzleStr[3] as SwizzleComponent;
    }

    switch (swizzleStr.length) {
        case 2:
            return swizzleBlock.xyOut;
        case 3:
            return swizzleBlock.xyzOut;
        case 4:
            return swizzleBlock.xyzw;
        default:
            throw new Error("Invalid swizzle string length");
    }
}

/**
 * Splits a vec2/3/4 into its components.
 * @param inputVec - The input vec.
 * @param options - Optional target options.
 * @returns The block exposing the vector components.
 */
export function splitVec(inputVec: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): VectorSplitterBlock {
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
        default:
            throw new Error(`Invalid input type: ${String(inputVec.type)}`);
    }

    return splitBlock;
}

/**
 * @param input - Vector to measure.
 * @param options - Optional target options.
 * @returns Vector magnitude as a shader expression.
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
 * @param left - First point.
 * @param right - Second point.
 * @param options - Optional target options.
 * @returns Distance between the points as a shader expression.
 */
export function distance(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const distanceBlock = new DistanceBlock("distance");
    distanceBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(distanceBlock.left);
    right.connectTo(distanceBlock.right);
    return distanceBlock.output;
}

/**
 * @param input - Vector to normalize.
 * @param options - Optional target options.
 * @returns Unit-length vector as a shader expression.
 */
export function normalize(
    input: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const normalizeBlock = new NormalizeBlock("normalize");
    normalizeBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    input.connectTo(normalizeBlock.input);

    return normalizeBlock.output;
}

/**
 * @param left - The left vector.
 * @param right - The right vector.
 * @param options - Optional target options.
 * @returns Cross product of `left` and `right` as a shader expression.
 */
export function cross(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const crossBlock = new CrossBlock("cross");
    crossBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(crossBlock.left);
    right.connectTo(crossBlock.right);

    return crossBlock.output;
}

/**
 * @param left - The left vector.
 * @param right - The right vector.
 * @param options - Optional target options.
 * @returns Dot product of `left` and `right` as a shader expression.
 */
export function dot(
    left: NodeMaterialConnectionPoint,
    right: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const dotBlock = new DotBlock("dot");
    dotBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    left.connectTo(dotBlock.left);
    right.connectTo(dotBlock.right);

    return dotBlock.output;
}

/**
 * Rotates a vector around an axis by a given angle using Rodrigues' rotation formula.
 * @param vector - The vector to rotate.
 * @param axis - The axis of rotation (must be a unit vector).
 * @param theta - The rotation angle in radians.
 * @param options - Optional target options.
 * @returns The rotated vector.
 * @see https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
 */
export function rotateAround(
    vector: NodeMaterialConnectionPoint,
    axis: NodeMaterialConnectionPoint,
    theta: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const cosTheta = cos(theta, options);
    const sinTheta = sin(theta, options);
    const oneMinusCosTheta = sub(float(1, options), cosTheta, options);

    const term1 = mul(cosTheta, vector, options);
    const term2 = mul(sinTheta, cross(axis, vector, options), options);
    const term3 = mul(oneMinusCosTheta, mul(axis, dot(axis, vector, options), options), options);

    return add(add(term1, term2, options), term3, options);
}
