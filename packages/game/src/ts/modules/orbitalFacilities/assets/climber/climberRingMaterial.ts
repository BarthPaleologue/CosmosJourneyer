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
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import {
    builtinAttribute,
    float,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    reflection,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec,
} from "babylonjs-shading-language";

import type { PBRTextures } from "@/frontend/assets/textures/materials";

export class ClimberRingMaterial extends NodeMaterial {
    constructor(name: string, textures: PBRTextures, scene: Scene) {
        super(name, scene);
        this.mode = NodeMaterialModes.Material;

        // Vertex

        const position = builtinAttribute("position");
        const normal = builtinAttribute("normal");
        const uv = builtinAttribute("uv");

        const meshUVScaleFactor = vec(new Vector2(2, 10));
        const proceduralUV = mul(uv, meshUVScaleFactor);

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        // Fragment

        const albedoTexture = uniformTexture2d(textures.albedo).source;
        const metallicRoughnessTexture = uniformTexture2d(textures.metallicRoughness).source;
        const aoTexture = uniformTexture2d(textures.ambientOcclusion).source;
        const normalTexture = uniformTexture2d(textures.normal).source;

        const albedo = textureSample(albedoTexture, proceduralUV, { convertToLinearSpace: true });
        const metallicRoughnesstexture = textureSample(metallicRoughnessTexture, proceduralUV);
        const aoTextureValue = textureSample(aoTexture, proceduralUV);
        const normalTextureValue = textureSample(normalTexture, proceduralUV);

        const perturbedNormal = perturbNormal(proceduralUV, positionW, normalW, normalTextureValue.rgb, float(1));

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrColor = pbr(
            metallicRoughnesstexture.r,
            metallicRoughnesstexture.g,
            normalW,
            view,
            cameraPosition,
            positionW,
            {
                reflection: reflection(position, world),
                albedoRgb: albedo.rgb,
                ambientOcclusion: aoTextureValue.r,
                perturbedNormal: perturbedNormal.output,
            },
        );

        const fragmentOutput = outputFragColor(pbrColor.lighting);

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);
        this.build();
    }
}
