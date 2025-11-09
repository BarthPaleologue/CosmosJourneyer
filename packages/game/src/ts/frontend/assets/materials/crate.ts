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
    add,
    f,
    getViewDirection,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "../../helpers/bsl";

export class CrateMaterial {
    private readonly material: NodeMaterial;

    constructor(
        textures: {
            albedo: Texture;
            metallicRoughness: Texture;
            normalHeight: Texture;
            ambientOcclusion: Texture;
        },
        scene: Scene,
    ) {
        this.material = new NodeMaterial("CrateMaterial", scene);

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const cameraPosition = uniformCameraPosition();
        const viewDirection = getViewDirection(positionW, cameraPosition);

        const normalHeightMapValue = textureSample(textures.normalHeight, uv);
        const { output: perturbedNormal, uvOffset } = perturbNormal(
            uv,
            positionW,
            normalW,
            normalHeightMapValue.rgb,
            f(1),
            {
                parallax: {
                    viewDirection: viewDirection,
                    scale: f(0.04),
                },
            },
        );

        const sampleUV = add(uv, uvOffset);

        const albedoTexture = textureSample(textures.albedo, sampleUV, {
            convertToLinearSpace: true,
        });
        const metallicRoughness = textureSample(textures.metallicRoughness, sampleUV);
        const ambientOcclusion = textureSample(textures.ambientOcclusion, sampleUV);

        const view = uniformView();

        const pbrShading = pbr(
            metallicRoughness.r,
            metallicRoughness.g,
            perturbedNormal,
            normalW,
            view,
            cameraPosition,
            positionW,
            {
                albedoRgb: albedoTexture.rgb,
                ambientOcclusion: ambientOcclusion.r,
            },
        );

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
