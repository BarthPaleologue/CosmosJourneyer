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
import type { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import type { Vector2, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";

import type { TargetOptions } from "./target";

export type BslInput = number | Vector2 | Vector3 | Vector4 | Color3 | Color4 | NodeMaterialConnectionPoint;

/**
 * Converts literal values to constants and preserves existing graph connections.
 * @param value - A literal value or an existing shader connection.
 * @param options - Optional target selection for literal inputs.
 * @returns The constant input, unchanged connection, or undefined for an absent input.
 */
export function parse(value: BslInput, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint;
export function parse(
    value: BslInput | undefined,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint | undefined;
export function parse(
    value: BslInput | undefined,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "number" && "connectTo" in value) {
        return value;
    }

    const input = new InputBlock("literal");
    input.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    input.isConstant = true;
    input.value = value;
    return input.output;
}
