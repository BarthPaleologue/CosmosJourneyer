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
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    splitVec,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformTexture2d,
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
            normalHeight: Texture;
            ambientOcclusion: Texture;
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

        const splitUV = splitVec(uv);

        const scaling = f(3);
        const scaledUV = mul(vec2(splitUV.y, splitUV.x), scaling);

        const cameraPosition = uniformCameraPosition();
        const viewDirection = getViewDirection(positionW, cameraPosition);

        const normalHeightMapTexture = uniformTexture2d(textures.normalHeight).source;
        const normalHeightMapValue = textureSample(normalHeightMapTexture, scaledUV);
        const { output: perturbedNormal, uvOffset } = perturbNormal(
            scaledUV,
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

        const sampleUV = add(scaledUV, uvOffset);

        const albedoTexture = uniformTexture2d(textures.albedo).source;
        const roughnessTexture = uniformTexture2d(textures.roughness).source;
        const ambientOcclusionTexture = uniformTexture2d(textures.ambientOcclusion).source;

        const albedo = textureSample(albedoTexture, sampleUV, {
            convertToLinearSpace: true,
        });
        const roughness = textureSample(roughnessTexture, sampleUV);
        const ambientOcclusion = textureSample(ambientOcclusionTexture, sampleUV);

        const view = uniformView();

        const pbrShading = pbr(f(0.0), roughness.r, normalW, view, cameraPosition, positionW, {
            albedoRgb: albedo.rgb,
            perturbedNormal,
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
