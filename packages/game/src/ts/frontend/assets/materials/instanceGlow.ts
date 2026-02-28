//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import type { Scene } from "@babylonjs/core/scene";
import {
    getInstanceData,
    instanceAttribute,
    outputFragColor,
    outputVertexPosition,
    splitRgba,
    transformPosition,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "babylonjs-shading-language";

export class InstanceGlowMaterial {
    private readonly material: NodeMaterial;

    constructor(scene: Scene) {
        this.material = new NodeMaterial("InstanceGlowMaterial", scene);

        const position = vertexAttribute("position");

        const world0 = instanceAttribute("world0");
        const world1 = instanceAttribute("world1");
        const world2 = instanceAttribute("world2");
        const world3 = instanceAttribute("world3");

        const globalWorld = uniformWorld();
        const { output: instanceWorld } = getInstanceData(world0, world1, world2, world3, globalWorld);

        const instanceColorRgba = instanceAttribute("instanceColor");

        const instanceColorRgb = splitRgba(instanceColorRgba).rgbOut;

        const positionW = transformPosition(instanceWorld, position);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const fragOutput = outputFragColor(instanceColorRgb, { glow: instanceColorRgb });

        this.material.addOutputNode(vertexOutput);
        this.material.addOutputNode(fragOutput);
        this.material.build();
    }

    get() {
        return this.material;
    }

    dispose() {
        this.material.dispose();
    }
}
