//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import {
    f,
    getInstanceData,
    instanceAttribute,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "babylonjs-shading-language";

import { triPlanarMaterial } from "@/utils/bslExtensions";

export class RockMaterial {
    private readonly material: NodeMaterial;

    constructor(
        textures: {
            normalAmbientOcclusion: Texture;
            albedoRoughness: Texture;
        },
        scene: Scene,
    ) {
        this.material = new NodeMaterial("RockMaterial", scene);

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");

        const globalWorld = uniformWorld();
        const world0 = instanceAttribute("world0");
        const world1 = instanceAttribute("world1");
        const world2 = instanceAttribute("world2");
        const world3 = instanceAttribute("world3");
        const { output: instanceWorld } = getInstanceData(world0, world1, world2, world3, globalWorld);

        const positionW = transformPosition(instanceWorld, position);
        const normalW = transformDirection(instanceWorld, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const cameraPosition = uniformCameraPosition();

        const rockSamples = triPlanarMaterial(textures, mul(position, f(0.5)), normal, {
            normalStrength: f(1.0),
        });

        const finalNormalW = transformDirection(instanceWorld, rockSamples.normal);

        const view = uniformView();
        const pbrShading = pbr(f(0), rockSamples.roughness, normalW, view, cameraPosition, positionW, {
            albedoRgb: rockSamples.albedo,
            perturbedNormal: finalNormalW,
            ambientOcclusion: rockSamples.ambientOcclusion,
        });

        const fragOutput = outputFragColor(pbrShading.lighting);

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
