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

import { ColorConverterBlock } from "@babylonjs/core/Materials/Node/Blocks/colorConverterBlock";
import { ColorSplitterBlock } from "@babylonjs/core/Materials/Node/Blocks/colorSplitterBlock";
import { GradientBlock, GradientBlockColorStep } from "@babylonjs/core/Materials/Node/Blocks/gradientBlock";
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

import type { TargetOptions } from "./target";

/**
 * @param value - The color value.
 * @param options - Optional target options.
 * @returns The color as a constant shader input.
 */
export function color(value: Color3 | Color4, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    const colorBlock = new InputBlock("color");
    colorBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    colorBlock.isConstant = true;
    colorBlock.value = value;

    return colorBlock.output;
}

/**
 * @param gradientSteps - Pairs of position and color.
 * @param t - The gradient input.
 * @param options - Optional target options.
 * @returns Color interpolated at `t` as a shader expression.
 */
export function sampleGradient(
    gradientSteps: ReadonlyArray<[number, Color3]>,
    t: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const gradientBlock = new GradientBlock("Gradient");
    gradientBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    gradientBlock.colorSteps = gradientSteps.map(([value, stepColor]) => new GradientBlockColorStep(value, stepColor));
    t.connectTo(gradientBlock.gradient);

    return gradientBlock.output;
}

/**
 * @param rgb - RGB color components.
 * @param options - Optional target options.
 * @returns HSL components as a shader expression.
 */
export function rgbToHsl(
    rgb: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const colorConverter = new ColorConverterBlock("RGBtoHSL");
    colorConverter.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    rgb.connectTo(colorConverter.rgbIn);

    return colorConverter.hslOut;
}

/**
 * @param hsl - HSL color components.
 * @param options - Optional target options.
 * @returns RGB components as a shader expression.
 */
export function hslToRgb(
    hsl: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const colorConverter = new ColorConverterBlock("HSLtoRGB");
    colorConverter.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    hsl.connectTo(colorConverter.hslIn);

    return colorConverter.rgbOut;
}

/**
 * Splits an RGBA color into its individual channels.
 * @param inputColor - The input color.
 * @param options - Optional target options.
 * @returns The block exposing the color channels.
 */
export function splitRgba(
    inputColor: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): ColorSplitterBlock {
    const splitBlock = new ColorSplitterBlock("splitColor");
    splitBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    inputColor.connectTo(splitBlock.rgba);

    return splitBlock;
}
