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
    pbrMetallicRoughnessMaterial,
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
    xz,
} from "@/utils/bsl";

export function createInsulationSheetMaterial(
    name: string,
    textures: { albedo: Texture; normal: Texture; metallic: Texture; roughness: Texture; ambientOcclusion: Texture },
    scene: Scene,
) {
    const material = new NodeMaterial(name, scene);

    const position = vertexAttribute("position");
    const normal = vertexAttribute("normal");

    const splitPosition = split(position);
    const positionXY = vec2(splitPosition.x, splitPosition.y);
    const uv = mul(positionXY, f(10.0));

    const world = uniformWorld();
    const positionW = transformPosition(world, position);
    const normalW = transformDirection(world, normal);

    const viewProjection = uniformViewProjection();
    const positionClipSpace = transformPosition(viewProjection, positionW);

    const vertexOutput = outputVertexPosition(positionClipSpace);

    const albedoTexture = textureSample(textures.albedo, uv, {
        convertToLinearSpace: true,
    });
    const metallic = textureSample(textures.metallic, uv);
    const roughness = textureSample(textures.roughness, uv);
    const ambientOcclusion = textureSample(textures.ambientOcclusion, uv);
    const normalMapValue = textureSample(textures.normal, uv);

    const perturbedNormal = perturbNormal(uv, positionW, normalW, normalMapValue.rgb, f(0.2));

    const view = uniformView();
    const cameraPosition = uniformCameraPosition();

    const pbrLighting = pbrMetallicRoughnessMaterial(
        albedoTexture.rgb,
        metallic.r,
        roughness.r,
        ambientOcclusion.r,
        perturbedNormal,
        normalW,
        view,
        cameraPosition,
        positionW,
    );

    const fragOutput = outputFragColor(pbrLighting);

    material.addOutputNode(vertexOutput);
    material.addOutputNode(fragOutput);
    material.build();

    return material;
}
