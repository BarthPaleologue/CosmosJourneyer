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

import { ArcTan2Block } from "@babylonjs/core/Materials/Node/Blocks/arcTan2Block";
import {
    TrigonometryBlockOperations,
    TrigonometryBlock,
} from "@babylonjs/core/Materials/Node/Blocks/trigonometryBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";

import type { TargetOptions } from "./target";

/**
 * @param input - The input value.
 * @param operation - The trigonometry operation to perform.
 * @param options - Optional target options.
 * @returns Result of `operation` as a shader expression.
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
 * @param x - The x coordinate.
 * @param y - The y coordinate.
 * @param options - Optional target options.
 * @returns The angle of `(x, y)` in radians, preserving its quadrant.
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
 * @param x - Angle in radians.
 * @param options - Optional target options.
 * @returns Sine of `x` as a shader expression.
 */
export function sin(x: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return trig(x, TrigonometryBlockOperations.Sin, options);
}

/**
 * @param x - Angle in radians.
 * @param options - Optional target options.
 * @returns Cosine of `x` as a shader expression.
 */
export function cos(x: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return trig(x, TrigonometryBlockOperations.Cos, options);
}

/**
 * @param x - Input value.
 * @param options - Optional target options.
 * @returns Arc cosine of `x` in radians as a shader expression.
 */
export function acos(x: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return trig(x, TrigonometryBlockOperations.ArcCos, options);
}
