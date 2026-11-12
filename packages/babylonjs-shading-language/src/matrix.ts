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

import { MatrixSplitterBlock } from "@babylonjs/core/Materials/Node/Blocks/matrixSplitterBlock";
import { TransformBlock } from "@babylonjs/core/Materials/Node/Blocks/transformBlock";
import { ViewDirectionBlock } from "@babylonjs/core/Materials/Node/Blocks/viewDirectionBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";

import { parse } from "./bslInput";
import type { BslInput } from "./bslInput";
import type { TargetOptions } from "./target";

/**
 * @param worldPosition - The world position.
 * @param cameraPosition - The camera position.
 * @param options - Optional target options.
 * @returns Direction from the world position toward the camera.
 */
export function getViewDirection(
    worldPosition: BslInput,
    cameraPosition: BslInput,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const viewDirection = new ViewDirectionBlock("viewDirection");
    viewDirection.target = options?.target ?? NodeMaterialBlockTargets.Neutral;

    parse(worldPosition, options).connectTo(viewDirection.worldPosition);
    parse(cameraPosition, options).connectTo(viewDirection.cameraPosition);

    return viewDirection.output;
}

/**
 * @param transformMat4 - The transformation matrix.
 * @param positionVec3 - The position vector.
 * @param options - Optional target options.
 * @returns The transformed position as a shader expression.
 */
export function transformPosition(
    transformMat4: NodeMaterialConnectionPoint,
    positionVec3: BslInput,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const transformBlock = new TransformBlock("TransformPosition");
    transformBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    transformBlock.complementZ = 0;
    transformBlock.complementW = 1;

    parse(positionVec3, options).connectTo(transformBlock.vector);
    transformMat4.connectTo(transformBlock.transform);

    return transformBlock.output;
}

/**
 * @param transformMat4 - The transformation matrix.
 * @param directionVec3 - The direction vector.
 * @param options - Optional target options.
 * @returns The transformed direction as a shader expression.
 */
export function transformDirection(
    transformMat4: NodeMaterialConnectionPoint,
    directionVec3: BslInput,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint {
    const transformBlock = new TransformBlock("TransformDirection");
    transformBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    transformBlock.complementZ = 0;
    transformBlock.complementW = 0;

    parse(directionVec3, options).connectTo(transformBlock.vector);
    transformMat4.connectTo(transformBlock.transform);

    return transformBlock.output;
}

export type MatrixSplitterOutput = {
    row0: NodeMaterialConnectionPoint;
    row1: NodeMaterialConnectionPoint;
    row2: NodeMaterialConnectionPoint;
    row3: NodeMaterialConnectionPoint;
    col0: NodeMaterialConnectionPoint;
    col1: NodeMaterialConnectionPoint;
    col2: NodeMaterialConnectionPoint;
    col3: NodeMaterialConnectionPoint;
};

/**
 * @param input - The input matrix.
 * @param options - Optional target options.
 * @returns Row and column vectors exposed as shader connection points.
 */
export function splitMatrix(
    input: NodeMaterialConnectionPoint,
    options?: Partial<TargetOptions>,
): MatrixSplitterOutput {
    const splitBlock = new MatrixSplitterBlock("splitMatrix");
    splitBlock.target = options?.target ?? NodeMaterialBlockTargets.Neutral;
    input.connectTo(splitBlock.input);

    return splitBlock;
}
