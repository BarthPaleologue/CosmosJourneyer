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

import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";

import type { TargetOptions } from "./target";

/**
 * @param value - The float value.
 * @param options - Optional target options.
 * @returns The value as a constant shader input.
 */
export function f32(value: number, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const inputBlock = new InputBlock("float");
    inputBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    inputBlock.value = value;
    inputBlock.isConstant = true;

    return inputBlock.output;
}

/**
 * @param name - The name of the input block.
 * @param options - Optional input block options, including `defaultValue` and `target`.
 * @returns A uniform float input block initialized from `defaultValue` or zero.
 */
export function uniformF32(name: string, options?: Partial<UniformF32Options>): InputBlock {
    const inputBlock = new InputBlock(name);
    inputBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    inputBlock.matrixMode = 0;
    inputBlock.value = options?.defaultValue ?? 0;

    return inputBlock;
}

export type UniformF32Options = TargetOptions & {
    defaultValue: number;
};
