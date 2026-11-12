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

import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";

import {
    builtinAttribute,
    outputFragColor,
    outputVertexPosition,
    transformPosition,
    uniformViewProjection,
    uniformWorld,
} from "./index";

/**
 * Creates the simplest possible NodeMaterial: positions are transformed to clip space by the
 * model-view-projection matrix, and every fragment is painted with the same color.
 * @param scene - The scene the material belongs to.
 * @param albedo - The color written to every fragment.
 * @returns The built node material, ready to be assigned to a mesh.
 */
export function createPlainColorMaterial(scene: Scene, albedo: Color3): NodeMaterial {
    const material = new NodeMaterial("PlainColorMaterial", scene);

    const position = builtinAttribute("position");

    const world = uniformWorld();
    const viewProjection = uniformViewProjection();

    const positionWorld = transformPosition(world, position);
    const positionClip = transformPosition(viewProjection, positionWorld);

    material.addOutputNode(outputVertexPosition(positionClip));
    material.addOutputNode(outputFragColor(albedo));

    material.build();

    return material;
}
