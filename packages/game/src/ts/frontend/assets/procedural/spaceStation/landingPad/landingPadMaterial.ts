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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Scene } from "@babylonjs/core/scene";
import {
    add,
    f,
    length,
    min,
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
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec,
    vec2,
    vertexAttribute,
    xz,
} from "babylonjs-shading-language";

import { type PBRTextures } from "@/frontend/assets/textures/materials";

import { Settings } from "@/settings";

export class LandingPadMaterial extends NodeMaterial {
    constructor(textures: PBRTextures, scene: Scene) {
        super(`LandingPadMaterial`, scene);
        this.mode = NodeMaterialModes.Material;

        // Vertex Shader

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");
        const uvSplit = splitVec(uv);

        const centeredUV = splitVec(sub(uv, f(0.5)));
        const centeredUVScaled = vec2(mul(centeredUV.x, f(Settings.LANDING_PAD_ASPECT_RATIO)), centeredUV.y);

        const proceduralUV = mul(xz(position), f(0.1));

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        // Fragment Shader

        const paintAlbedo = vec(Vector3.One());
        const paintMetallic = f(0);
        const paintRoughness = f(0.2);
        const paintAmbientOcclusion = f(1);

        const borderThickness = f(0.03);

        const borderLeftMask = step(uvSplit.x, borderThickness);
        const borderRightMask = step(sub(f(1), uvSplit.x), borderThickness);

        const borderX = add(borderLeftMask, borderRightMask);

        const borderTopMask = step(uvSplit.y, borderThickness);
        const borderBottomMask = step(sub(f(1), uvSplit.y), borderThickness);

        const borderY = add(borderTopMask, borderBottomMask);

        const borderWeight = min(add(borderX, borderY), f(1));

        const circleRadius = f(0.25);
        const circleThickness = f(0.01);
        const distToCenter = length(centeredUVScaled);

        const circleMinRadius = sub(circleRadius, circleThickness);
        const circleMaxRadius = add(circleRadius, circleThickness);
        const smoothness = f(0.005);

        const circleMask = mul(
            smoothstep(circleMinRadius, add(circleMinRadius, smoothness), distToCenter),
            sub(f(1), smoothstep(sub(circleMaxRadius, smoothness), circleMaxRadius, distToCenter)),
        );

        const fullPaintWeight = add(borderWeight, circleMask);

        const albedoTexture = uniformTexture2d(textures.albedo).source;
        const metallicRoughnessTexture = uniformTexture2d(textures.metallicRoughness).source;
        const normalTexture = uniformTexture2d(textures.normal).source;
        const occlusionTexture = uniformTexture2d(textures.ambientOcclusion).source;

        const albedo = textureSample(albedoTexture, proceduralUV, {
            convertToLinearSpace: true,
        });
        const metallicRoughness = textureSample(metallicRoughnessTexture, proceduralUV);
        const normalMapValue = textureSample(normalTexture, proceduralUV);
        const ambientOcclusion = textureSample(occlusionTexture, proceduralUV);

        const finalAlbedo = mix(albedo.rgb, paintAlbedo, fullPaintWeight);
        const finalMetallic = mix(metallicRoughness.r, paintMetallic, fullPaintWeight);
        const finalRoughness = mix(metallicRoughness.g, paintRoughness, fullPaintWeight);
        const finalAmbientOcclusion = mix(ambientOcclusion.r, paintAmbientOcclusion, fullPaintWeight);

        const perturbedNormal = perturbNormal(
            proceduralUV,
            positionW,
            normalW,
            normalMapValue.rgb,
            sub(f(1), mul(fullPaintWeight, f(0.8))),
        );

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrLighting = pbr(finalMetallic, finalRoughness, normalW, view, cameraPosition, positionW, {
            albedoRgb: finalAlbedo,
            ambientOcclusion: finalAmbientOcclusion,
            perturbedNormal: perturbedNormal.output,
        });

        const fragOutput = outputFragColor(pbrLighting.lighting);

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragOutput);
        this.build();
    }
}
