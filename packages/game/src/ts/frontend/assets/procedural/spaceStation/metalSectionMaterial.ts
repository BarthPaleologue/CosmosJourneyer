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

import { NodeMaterialModes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialModes";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { type Scene } from "@babylonjs/core/scene";
import * as BSL from "babylonjs-shading-language";

import { type PBRTextures } from "@/frontend/assets/textures/materials";

export class MetalSectionMaterial extends NodeMaterial {
    constructor(name: string, textures: PBRTextures, scene: Scene) {
        super(name, scene);
        this.mode = NodeMaterialModes.Material;

        // Vertex

        const position = BSL.vertexAttribute("position");
        const normal = BSL.vertexAttribute("normal");
        const uv = BSL.vertexAttribute("uv");

        const positionY = BSL.splitVec(position).y;
        const uvY = BSL.mul(positionY, BSL.float(1 / 50));

        const scaledUV = BSL.mul(uv, BSL.float(6.0));
        const proceduralUV = BSL.vec2(BSL.splitVec(scaledUV).x, uvY);

        const world = BSL.uniformWorld();
        const positionW = BSL.transformPosition(world, position);
        const normalW = BSL.transformDirection(world, normal);

        const viewProjection = BSL.uniformViewProjection();
        const positionClipSpace = BSL.transformPosition(viewProjection, positionW);

        const vertexOutput = BSL.outputVertexPosition(positionClipSpace);

        // Fragment

        const albedoTexture = BSL.uniformTexture2d(textures.albedo).source;
        const metallicRoughnessTexture = BSL.uniformTexture2d(textures.metallicRoughness).source;
        const aoTexture = BSL.uniformTexture2d(textures.ambientOcclusion).source;
        const normalTexture = BSL.uniformTexture2d(textures.normal).source;

        const albedo = BSL.textureSample(albedoTexture, proceduralUV, {
            convertToLinearSpace: true,
        });
        const metallicRoughness = BSL.textureSample(metallicRoughnessTexture, proceduralUV);
        const ao = BSL.textureSample(aoTexture, proceduralUV);
        const normalTextureValue = BSL.textureSample(normalTexture, proceduralUV);

        const perturbedNormal = BSL.perturbNormal(
            proceduralUV,
            positionW,
            normalW,
            normalTextureValue.rgb,
            BSL.float(1),
        );

        const view = BSL.uniformView();
        const cameraPosition = BSL.uniformCameraPosition();

        const pbrColor = BSL.pbr(metallicRoughness.r, metallicRoughness.g, normalW, view, cameraPosition, positionW, {
            albedoRgb: albedo.rgb,
            ambientOcclusion: ao.r,
            perturbedNormal: perturbedNormal.output,
        });

        const fragmentOutput = BSL.outputFragColor(pbrColor.lighting);

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);
        this.build();
    }
}
