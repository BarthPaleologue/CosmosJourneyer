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
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";

import {
    f,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    split,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec2,
    vertexAttribute,
} from "../helpers/bsl";

export class TireMaterial {
    private readonly material: NodeMaterial;

    constructor(
        textures: {
            albedo: Texture;
            roughness: Texture;
            normal: Texture;
            ambientOcclusion: Texture;
            height: Texture;
        },
        scene: Scene,
    ) {
        this.material = new NodeMaterial("tireMaterial", scene);

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const splitUV = split(uv);

        const scaledUV = mul(vec2(splitUV.y, splitUV.x), f(5.0));

        const albedoTexture = textureSample(textures.albedo, scaledUV, {
            convertToLinearSpace: true,
        });
        const roughness = textureSample(textures.roughness, scaledUV);
        const normalMapValue = textureSample(textures.normal, scaledUV);
        const ambientOcclusion = textureSample(textures.ambientOcclusion, scaledUV);

        const perturbedNormal = perturbNormal(scaledUV, positionW, normalW, normalMapValue.rgb, f(1));

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrShading = pbr(f(0.0), roughness.r, perturbedNormal, normalW, view, cameraPosition, positionW, {
            albedoRgb: albedoTexture.rgb,
            ambientOcclusion: ambientOcclusion.r,
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
