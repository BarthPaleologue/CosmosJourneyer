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

import { NodeMaterialBlockConnectionPointTypes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { NodeMaterialBlock } from "@babylonjs/core/Materials/Node/nodeMaterialBlock";
import {
    NodeMaterialConnectionPoint,
    NodeMaterialConnectionPointDirection,
} from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { NodeMaterialBuildState } from "@babylonjs/core/Materials/Node/nodeMaterialBuildState";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore";

/**
 * Reads the instance index within the current draw without requiring instance matrix attributes.
 */
export class InstanceIndexBlock extends NodeMaterialBlock {
    public readonly output: NodeMaterialConnectionPoint;

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.output = new NodeMaterialConnectionPoint("output", this, NodeMaterialConnectionPointDirection.Output);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float, undefined, this.output);
    }

    public override getClassName(): string {
        return "InstanceIndexBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState): this {
        super._buildBlock(state);

        let value = "0.0";
        if (state.sharedData.scene.getEngine().getCaps().canUseGLInstanceID) {
            value =
                state.shaderLanguage === ShaderLanguage.WGSL
                    ? "f32(vertexInputs.instanceIndex)"
                    : "float(gl_InstanceID)";
        }

        state.compilationString += `${state._declareOutput(this.output)} = ${value};\n`;
        return this;
    }
}

RegisterClass("BABYLON.InstanceIndexBlock", InstanceIndexBlock);
