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

import { DiscardBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/discardBlock";
import { FragmentOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { FrontFacingBlock } from "@babylonjs/core/Materials/Node/Blocks/Fragment/frontFacingBlock";
import { VertexOutputBlock } from "@babylonjs/core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";

import { parse } from "./bslInput";
import type { BslInput } from "./bslInput";
import type { TargetOptions } from "./target";

/**
 * Discards fragments where value is below cutoff.
 * @param value - The test value.
 * @param cutoff - The cutoff threshold.
 * @returns The configured fragment discard block.
 */
export function discardTest(value: BslInput, cutoff: BslInput): DiscardBlock {
    const discardBlock = new DiscardBlock("discard");
    discardBlock.target = NodeMaterialBlockTargets.Fragment;

    parse(value).connectTo(discardBlock.value);
    parse(cutoff).connectTo(discardBlock.cutoff);

    return discardBlock;
}

export type OutputFragColorOptions = {
    convertToLinearSpace: boolean;
    convertToGammaSpace: boolean;
    alpha: BslInput;
    glow: BslInput;
};

/**
 * Outputs the fragment color using the given parameters.
 * @param colorRgb - The color.
 * @param options - Optional properties for the fragment output block.
 * @returns The fragment output block connected to the color.
 */
export function outputFragColor(colorRgb: BslInput, options?: Partial<OutputFragColorOptions>): FragmentOutputBlock {
    const FragmentOutput = new FragmentOutputBlock("FragmentOutput");
    FragmentOutput.target = NodeMaterialBlockTargets.Fragment;
    FragmentOutput.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    FragmentOutput.convertToLinearSpace = options?.convertToLinearSpace ?? false;

    parse(colorRgb).connectTo(FragmentOutput.rgb);
    parse(options?.alpha)?.connectTo(FragmentOutput.a);
    parse(options?.glow)?.connectTo(FragmentOutput.additionalColor);

    return FragmentOutput;
}

/**
 * Outputs the vertex position using the given parameters.
 * @param positionVec4 - The position vector.
 * @param options - Optional target options.
 * @returns The vertex output block connected to the position.
 */
export function outputVertexPosition(positionVec4: BslInput, options?: Partial<TargetOptions>): VertexOutputBlock {
    const VertexOutput = new VertexOutputBlock("VertexOutput");
    VertexOutput.target = options?.target ?? NodeMaterialBlockTargets.Vertex;

    parse(positionVec4, options).connectTo(VertexOutput.vector);

    return VertexOutput;
}

/**
 * @returns Front-facing state of the current fragment.
 */
export function getFrontFacing(): NodeMaterialConnectionPoint {
    const frontFacingBlock = new FrontFacingBlock("frontFacing");
    frontFacingBlock.target = NodeMaterialBlockTargets.Fragment;
    return frontFacingBlock.output;
}
