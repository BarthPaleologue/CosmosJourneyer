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

import { AddBlock } from "@babylonjs/core/Materials/Node/Blocks/addBlock";
import { DivideBlock } from "@babylonjs/core/Materials/Node/Blocks/divideBlock";
import { LerpBlock } from "@babylonjs/core/Materials/Node/Blocks/lerpBlock";
import { MaxBlock } from "@babylonjs/core/Materials/Node/Blocks/maxBlock";
import { MinBlock } from "@babylonjs/core/Materials/Node/Blocks/minBlock";
import { ModBlock } from "@babylonjs/core/Materials/Node/Blocks/modBlock";
import { MultiplyBlock } from "@babylonjs/core/Materials/Node/Blocks/multiplyBlock";
import { NegateBlock } from "@babylonjs/core/Materials/Node/Blocks/negateBlock";
import { OneMinusBlock } from "@babylonjs/core/Materials/Node/Blocks/oneMinusBlock";
import { PowBlock } from "@babylonjs/core/Materials/Node/Blocks/powBlock";
import { RemapBlock } from "@babylonjs/core/Materials/Node/Blocks/remapBlock";
import { SmoothStepBlock } from "@babylonjs/core/Materials/Node/Blocks/smoothStepBlock";
import { StepBlock } from "@babylonjs/core/Materials/Node/Blocks/stepBlock";
import { SubtractBlock } from "@babylonjs/core/Materials/Node/Blocks/subtractBlock";
import {
    TrigonometryBlock,
    TrigonometryBlockOperations,
} from "@babylonjs/core/Materials/Node/Blocks/trigonometryBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";

import { parse } from "./bslInput";
import type { BslInput } from "./bslInput";
import type { TargetOptions } from "./target";
import { trig } from "./trigonometry";

/**
 * @param x - Input value.
 * @param options - Optional target options.
 * @returns Square root of `x` as a shader expression.
 */
export function sqrt(x: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return trig(x, TrigonometryBlockOperations.Sqrt, options);
}

/**
 * @param x - Input value.
 * @param options - Optional target options.
 * @returns Sign of `x` as a shader expression.
 */
export function sign(x: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    return trig(x, TrigonometryBlockOperations.Sign, options);
}

/**
 * @param x - Value to negate.
 * @param options - Optional target options.
 * @returns Negative of `x` as a shader expression.
 */
export function negate(x: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const negateBlock = new NegateBlock("negate");
    negateBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    x.connectTo(negateBlock.value);
    return negateBlock.output;
}

/**
 * @param input - The input value to remap.
 * @param sourceRange - The input range tuple as `[min, max]`.
 * @param targetRange - The output range tuple as `[min, max]`.
 * @param options - Optional target options.
 * @returns Value remapped to `targetRange` as a shader expression.
 */
export function remap(
    input: NodeMaterialConnectionPoint,
    sourceRange: Readonly<[number, number]>,
    targetRange: Readonly<[number, number]>,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const remapBlock = new RemapBlock("remap");
    remapBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    remapBlock.sourceRange = new Vector2(sourceRange[0], sourceRange[1]);
    remapBlock.targetRange = new Vector2(targetRange[0], targetRange[1]);

    input.connectTo(remapBlock.input);

    return remapBlock.output;
}

/**
 * @param input - Value whose fractional part is requested.
 * @param options - Optional target options.
 * @returns Fractional part of `input` as a shader expression.
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
 * @param left - The left vector.
 * @param right - The right vector.
 * @param options - Optional target options.
 * @returns Product of `left` and `right` as a shader expression.
 */
export function mul(left: BslInput, right: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const mulBlock = new MultiplyBlock("mul");
    mulBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(left, options).connectTo(mulBlock.left);
    parse(right, options).connectTo(mulBlock.right);

    return mulBlock.output;
}

/**
 * @param left - The dividend value.
 * @param right - The divisor value.
 * @param options - Optional target options.
 * @returns Quotient of `left` and `right` as a shader expression.
 */
export function div(left: BslInput, right: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const mulBlock = new DivideBlock("div");
    mulBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(left, options).connectTo(mulBlock.left);
    parse(right, options).connectTo(mulBlock.right);

    return mulBlock.output;
}

/**
 * @param value - The base value.
 * @param power - The exponent.
 * @param options - Optional target options.
 * @returns `value` raised to `power` as a shader expression.
 */
export function pow(value: BslInput, power: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const powBlock = new PowBlock("pow");
    powBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(value, options).connectTo(powBlock.value);
    parse(power, options).connectTo(powBlock.power);

    return powBlock.output;
}

/**
 * @param edge - The edge value.
 * @param x - The input value.
 * @param options - Optional target options.
 * @returns Zero below `edge`, otherwise one, as a shader expression.
 */
export function step(edge: BslInput, x: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const stepBlock = new StepBlock("step");
    stepBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(edge, options).connectTo(stepBlock.edge);
    parse(x, options).connectTo(stepBlock.value);

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
    edge0: BslInput,
    edge1: BslInput,
    x: BslInput,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const stepBlock = new SmoothStepBlock("smoothstep");
    stepBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(edge0, options).connectTo(stepBlock.edge0);
    parse(edge1, options).connectTo(stepBlock.edge1);
    parse(x, options).connectTo(stepBlock.value);

    return stepBlock.output;
}

/**
 * @param input - Value whose absolute value is requested.
 * @param options - Optional target options.
 * @returns Absolute value as a shader expression.
 */
export function abs(input: NodeMaterialConnectionPoint, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
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
 * @returns Interpolated value as a shader expression.
 */
export function mix(
    x: BslInput,
    y: BslInput,
    a: BslInput,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const mixBlock = new LerpBlock("mix");
    mixBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(x, options).connectTo(mixBlock.left);
    parse(y, options).connectTo(mixBlock.right);
    parse(a, options).connectTo(mixBlock.gradient);

    return mixBlock.output;
}

/**
 * @param left - The first value to add.
 * @param right - The second value to add.
 * @param options - Optional target options.
 * @returns Sum of `left` and `right` as a shader expression.
 */
export function add(left: BslInput, right: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const addBlock = new AddBlock("add");
    addBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(left, options).connectTo(addBlock.left);
    parse(right, options).connectTo(addBlock.right);

    return addBlock.output;
}

/**
 * @param left - The left value.
 * @param right - The right value to subtract.
 * @param options - Optional target options.
 * @returns `left` minus `right` as a shader expression.
 */
export function sub(left: BslInput, right: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const subBlock = new SubtractBlock("sub");
    subBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(left, options).connectTo(subBlock.left);
    parse(right, options).connectTo(subBlock.right);

    return subBlock.output;
}

/**
 * @param left - The dividend value.
 * @param right - The divisor value.
 * @param options - Optional target options.
 * @returns Remainder of `left` divided by `right` as a shader expression.
 */
export function mod(left: BslInput, right: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const modBlock = new ModBlock("mod");
    modBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(left, options).connectTo(modBlock.left);
    parse(right, options).connectTo(modBlock.right);

    return modBlock.output;
}

/**
 * @param input - Value to subtract from one.
 * @param options - Optional target options.
 * @returns One minus `input` as a shader expression.
 */
export function oneMinus(
    input: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const oneMinusBlock = new OneMinusBlock("oneMinus");
    oneMinusBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    input.connectTo(oneMinusBlock.input);
    return oneMinusBlock.output;
}

/**
 * Returns the minimum of two values.
 * @param left - The first value to compare.
 * @param right - The second value to compare.
 * @param options - Optional target options.
 * @returns The minimum value as a connection point.
 */
export function min(left: BslInput, right: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const minBlock = new MinBlock("min");
    minBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(left, options).connectTo(minBlock.left);
    parse(right, options).connectTo(minBlock.right);

    return minBlock.output;
}

/**
 * Returns the maximum of two values.
 * @param left - The first value to compare.
 * @param right - The second value to compare.
 * @param options - Optional target options.
 * @returns The maximum value as a connection point.
 */
export function max(left: BslInput, right: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const maxBlock = new MaxBlock("max");
    maxBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(left, options).connectTo(maxBlock.left);
    parse(right, options).connectTo(maxBlock.right);

    return maxBlock.output;
}

/**
 * Hashes a float into a pseudo-random value in [0, 1).
 * @param input - The input value.
 * @param options - Optional target options.
 * @returns The hashed value.
 * @see https://www.shadertoy.com/view/4djSRW
 */
export function hash11(
    input: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const a = fract(mul(input, 0.1031, options), options);
    const b = mul(a, add(a, 33.33, options), options);
    const c = mul(b, add(b, b, options), options);
    return fract(c, options);
}
