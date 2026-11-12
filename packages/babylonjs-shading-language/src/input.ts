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

import { AnimatedInputBlockTypes } from "@babylonjs/core/Materials/Node/Blocks/Input/animatedInputBlockTypes";
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { NodeMaterialSystemValues } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialSystemValues";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import type { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";

import type { TargetOptions } from "./target";

/**
 * @param options - Optional target options.
 * @returns Camera position as a shader uniform connection.
 */
export function uniformCameraPosition(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const cameraPosition = new InputBlock("cameraPosition");
    cameraPosition.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    cameraPosition.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);

    return cameraPosition.output;
}

/**
 * @param options - Optional target options.
 * @returns View matrix as a shader uniform connection.
 */
export function uniformView(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const view = new InputBlock("view");
    view.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    view.setAsSystemValue(NodeMaterialSystemValues.View);

    return view.output;
}

/**
 * @param options - Optional target options.
 * @returns View-projection matrix as a shader uniform connection.
 */
export function uniformViewProjection(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const ViewProjection = new InputBlock("ViewProjection");
    ViewProjection.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    ViewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);

    return ViewProjection.output;
}

/**
 * @param options - Optional target options.
 * @returns World matrix as a shader uniform connection.
 */
export function uniformWorld(options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const world = new InputBlock("world");
    world.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    world.setAsSystemValue(NodeMaterialSystemValues.World);

    return world.output;
}

/**
 * @returns Elapsed time in seconds as a shader uniform.
 */
export function uniformElapsedSeconds(): NodeMaterialConnectionPoint {
    const elapsedSecondsBlock = new InputBlock("Time");
    elapsedSecondsBlock.target = NodeMaterialBlockTargets.Vertex;
    elapsedSecondsBlock.value = 0;
    elapsedSecondsBlock.animationType = AnimatedInputBlockTypes.Time;
    return elapsedSecondsBlock.output;
}

export type AttributeType =
    | NodeMaterialBlockConnectionPointTypes.Float
    | NodeMaterialBlockConnectionPointTypes.Vector2
    | NodeMaterialBlockConnectionPointTypes.Vector3
    | NodeMaterialBlockConnectionPointTypes.Vector4
    | NodeMaterialBlockConnectionPointTypes.Color3
    | NodeMaterialBlockConnectionPointTypes.Color4;

/**
 * Returns an attribute input block with an explicit type for any attribute name.
 * The associated vertex buffer determines whether values are per vertex or per instance.
 * @param name - The name of the attribute in the mesh's vertex buffers.
 * @param type - The explicit scalar, vector, or color type of the attribute.
 * @param options - Optional target options (vertex by default).
 * @returns The named vertex attribute as a shader connection.
 */
export function attribute(
    name: string,
    type: AttributeType,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock(name, options?.target ?? NodeMaterialBlockTargets.Vertex, type);
    inputBlock.setAsAttribute(name);

    return inputBlock.output;
}

export type BuiltinAttributeName =
    | "position"
    | "normal"
    | "tangent"
    | "uv"
    | "uv2"
    | "matricesIndices"
    | "matricesWeights"
    | "matricesIndicesExtra"
    | "matricesWeightsExtra"
    | "world0"
    | "world1"
    | "world2"
    | "world3"
    | "instanceColor";

/**
 * Returns a built-in attribute input block whose type is inferred by Babylon.
 * The associated vertex buffer determines whether values are per vertex or per instance.
 * @param name - The name of the built-in attribute.
 * @param options - Optional target options.
 * @returns The built-in vertex attribute as a shader connection.
 */
export function builtinAttribute(
    name: BuiltinAttributeName,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock(name);
    inputBlock.target = options?.target ?? NodeMaterialBlockTargets.Vertex;
    inputBlock.setAsAttribute(name);

    return inputBlock.output;
}
