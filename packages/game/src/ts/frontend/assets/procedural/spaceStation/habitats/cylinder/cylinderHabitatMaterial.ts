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
    atan2,
    f,
    fract,
    length,
    mix,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    remap,
    smoothstep,
    splitVec,
    step,
    sub,
    Target,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec2,
    vec3,
    vertexAttribute,
    xz,
} from "@/frontend/helpers/bsl";

export class CylinderHabitatMaterial extends NodeMaterial {
    constructor(radius: number, height: number, tesselation: number, textures: PBRTextures, scene: Scene) {
        super("CylinderHabitatMaterial", scene);
        this.mode = NodeMaterialModes.Material;

        const circumference = 2 * Math.PI * radius;
        const nbSectors = tesselation;
        const sectorSize = circumference / nbSectors;

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const positionXZ = xz(position);
        const splitPositionXZ = splitVec(positionXZ);

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        // float mask = 1.0 - step(0.02, abs(normal.y));
        // vUV.y *= mix(1.0, height, mask);
        const mask = sub(f(1), step(f(0.02), abs(splitVec(normal).y)));
        const scaledUvY = mul(splitVec(uv).y, mix(f(1.0), f(height / sectorSize), mask));

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        this.addOutputNode(vertexOutput);

        const theta = atan2(splitPositionXZ.y, splitPositionXZ.x, { target: Target.FRAG });

        const distanceToCenter = mul(length(positionXZ, { target: Target.FRAG }), f(1.0 / sectorSize));

        const proceduralUvX = remap(theta, f(0), f(2 * Math.PI), f(0), f(nbSectors));
        const proceduralUvY = mix(distanceToCenter, scaledUvY, mask);
        const proceduralUV = vec2(proceduralUvX, proceduralUvY);

        const albedoTexture = uniformTexture2d(textures.albedo).source;
        const normalTexture = uniformTexture2d(textures.normal).source;
        const metallicRoughnessTexture = uniformTexture2d(textures.metallicRoughness).source;
        const occlusionTexture = uniformTexture2d(textures.ambientOcclusion).source;

        const albedo = textureSample(albedoTexture, proceduralUV, {
            convertToLinearSpace: true,
        });
        const normalMap = textureSample(normalTexture, proceduralUV);
        const metallicRoughness = textureSample(metallicRoughnessTexture, proceduralUV);
        const occlusion = textureSample(occlusionTexture, proceduralUV);

        const perturbedNormal = perturbNormal(proceduralUV, positionW, normalW, normalMap.rgb, f(1));

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrColor = pbr(metallicRoughness.r, metallicRoughness.g, normalW, view, cameraPosition, positionW, {
            albedoRgb: albedo.rgb,
            ambientOcclusion: occlusion.r,
            perturbedNormal: perturbedNormal.output,
        });

        const lightEmission = mul(
            mask,
            mul(
                mul(
                    smoothstep(f(0.48), f(0.5), fract(proceduralUvX)),
                    sub(f(1), smoothstep(f(0.5), f(0.52), fract(proceduralUvX))),
                ),
                mul(
                    smoothstep(f(0.4), f(0.45), fract(proceduralUvY)),
                    sub(f(1), smoothstep(f(0.55), f(0.6), fract(proceduralUvY))),
                ),
            ),
        );

        const lightColor = vec3(f(1), f(1), f(0.7));
        const glow = mul(lightEmission, lightColor);

        const fragOutput = outputFragColor(add(pbrColor.lighting, glow), { glow });

        this.addOutputNode(fragOutput);

        this.build();
    }
}
