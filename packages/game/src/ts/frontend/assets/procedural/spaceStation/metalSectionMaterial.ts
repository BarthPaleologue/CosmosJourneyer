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

import { type PBRTextures } from "@/frontend/assets/textures/materials";
import * as BSL from "@/frontend/helpers/bsl";

export class MetalSectionMaterial extends NodeMaterial {
    constructor(name: string, textures: PBRTextures, scene: Scene) {
        super(name, scene);
        this.mode = NodeMaterialModes.Material;

        // Vertex

        const position = BSL.vertexAttribute("position");
        const normal = BSL.vertexAttribute("normal");
        const uv = BSL.vertexAttribute("uv");

        const positionY = BSL.split(position).y;
        const uvY = BSL.mul(positionY, BSL.float(1 / 50));

        const scaledUV = BSL.mul(uv, BSL.float(6.0));
        const proceduralUV = BSL.vec2(BSL.split(scaledUV).x, uvY);

        const world = BSL.uniformWorld();
        const positionW = BSL.transformPosition(world, position);
        const normalW = BSL.transformDirection(world, normal);

        const viewProjection = BSL.uniformViewProjection();
        const positionClipSpace = BSL.transformPosition(viewProjection, positionW);

        const vertexOutput = BSL.outputVertexPosition(positionClipSpace);

        // Fragment

        const albedoTexture = BSL.textureSample(textures.albedo, proceduralUV, {
            convertToLinearSpace: true,
        });
        const metallicRoughnesstexture = BSL.textureSample(textures.metallicRoughness, proceduralUV);
        const aoTexture = BSL.textureSample(textures.ambientOcclusion, proceduralUV);
        const normalTexture = BSL.textureSample(textures.normal, proceduralUV);

        const perturbedNormal = BSL.perturbNormal(proceduralUV, positionW, normalW, normalTexture.rgb, BSL.float(1));

        const view = BSL.uniformView();
        const cameraPosition = BSL.uniformCameraPosition();

        const pbrColor = BSL.pbr(
            metallicRoughnesstexture.r,
            metallicRoughnesstexture.g,
            perturbedNormal.output,
            normalW,
            view,
            cameraPosition,
            positionW,
            {
                albedoRgb: albedoTexture.rgb,
                ambientOcclusion: aoTexture.r,
            },
        );

        const fragmentOutput = BSL.outputFragColor(pbrColor.lighting);

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);
        this.build();
    }
}
