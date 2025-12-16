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
import {
    abs,
    add,
    f,
    fract,
    mix,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    smoothstep,
    splitVec,
    step,
    sub,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec2,
    vec3,
    vertexAttribute,
} from "@/frontend/helpers/bsl";

export class RingHabitatMaterial extends NodeMaterial {
    constructor(meanRadius: number, deltaRadius: number, height: number, textures: PBRTextures, scene: Scene) {
        super("RingHabitatMaterial", scene);
        this.mode = NodeMaterialModes.Material;

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const splitUV = splitVec(uv);
        const scaledUvX = mul(splitUV.x, f((2.0 * Math.PI * meanRadius) / deltaRadius));
        // float mask = 1.0 - step(0.02, abs(normal.y));
        // vUV.y *= mix(1.0, height, mask);
        const mask = sub(f(1), step(f(0.02), abs(splitVec(normal).y)));
        const scaledUvY = mul(splitUV.y, mix(f(1.0), f(height), mask));
        const proceduralUV = vec2(scaledUvX, scaledUvY);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        this.addOutputNode(vertexOutput);

        const albedo = textureSample(textures.albedo, proceduralUV, {
            convertToLinearSpace: true,
        });
        const normalMap = textureSample(textures.normal, proceduralUV);
        const metallicRoughness = textureSample(textures.metallicRoughness, proceduralUV);
        const occlusion = textureSample(textures.ambientOcclusion, proceduralUV);

        const perturbedNormal = perturbNormal(proceduralUV, positionW, normalW, normalMap.rgb, f(1));

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrLighting = pbr(
            metallicRoughness.r,
            metallicRoughness.g,
            perturbedNormal.output,
            normalW,
            view,
            cameraPosition,
            positionW,
            {
                albedoRgb: albedo.rgb,
                ambientOcclusion: occlusion.r,
            },
        );

        const lightEmission = mul(
            mul(
                smoothstep(f(0.48), f(0.5), fract(scaledUvX)),
                sub(f(1), smoothstep(f(0.5), f(0.52), fract(scaledUvX))),
            ),
            mul(
                smoothstep(f(0.4), f(0.45), fract(scaledUvY)),
                sub(f(1), smoothstep(f(0.55), f(0.6), fract(scaledUvY))),
            ),
        );

        const lightColor = vec3(f(1), f(1), f(0.7));

        const finalColor = add(pbrLighting.lighting, mul(lightEmission, lightColor));
        const fragOutput = outputFragColor(finalColor);

        this.addOutputNode(fragOutput);

        this.build();
    }
}
