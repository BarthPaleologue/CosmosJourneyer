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

import { InstancesBlock } from "@babylonjs/core/Materials/Node/Blocks/Vertex/instancesBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";

import { InstanceIndexBlock } from "./instanceIndexBlock";
import type { TargetOptions } from "./target";

/**
 * Creates a shader connection point for the current draw instance index.
 * @returns the instance index within the current draw as a float computed in the vertex shader.
 */
export function instanceIndex(): NodeMaterialConnectionPoint {
    return new InstanceIndexBlock("InstanceIndex").output;
}

export type InstanceData = {
    output: NodeMaterialConnectionPoint;
    instanceID: NodeMaterialConnectionPoint;
};

/**
 * Builds an InstancesBlock using world matrix rows and base world matrix.
 * @param world0 - The first world matrix row.
 * @param world1 - The second world matrix row.
 * @param world2 - The third world matrix row.
 * @param world3 - The fourth world matrix row.
 * @param world - The base world matrix.
 * @param options - Optional target options.
 * @returns The instance transform and instance ID connection points.
 */
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
