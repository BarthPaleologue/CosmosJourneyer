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
    textureTriPlanarSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "../../helpers/bsl";

export class TriPlanarMaterial {
    private readonly material: NodeMaterial;

    constructor(
        textures: {
            albedo: Texture;
            roughness: Texture;
            metallic?: Texture;
            normal: Texture;
            ambientOcclusion: Texture;
        },
        scene: Scene,
        options?: Partial<{
            scale: number;
        }>,
    ) {
        this.material = new NodeMaterial("canopyFrameMaterial", scene);

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const samplePosition = mul(position, f(options?.scale ?? 1.0));

        const albedoTexture = textureTriPlanarSample(textures.albedo, samplePosition, normal, {
            convertToLinearSpace: true,
        });

        const normalMapValue = textureTriPlanarSample(textures.normal, samplePosition, normal);
        const ambientOcclusion = textureTriPlanarSample(textures.ambientOcclusion, samplePosition, normal);
        const roughness = textureTriPlanarSample(textures.roughness, samplePosition, normal);
        const metallic =
            textures.metallic !== undefined
                ? textureTriPlanarSample(textures.metallic, samplePosition, normal)
                : undefined;

        const cameraPosition = uniformCameraPosition();

        const view = uniformView();

        const perturbedNormal = perturbNormal(uv, positionW, normalW, normalMapValue.rgb, f(1));

        const pbrShading = pbr(
            metallic?.r ?? f(0.0),
            roughness.r,
            perturbedNormal.output,
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
