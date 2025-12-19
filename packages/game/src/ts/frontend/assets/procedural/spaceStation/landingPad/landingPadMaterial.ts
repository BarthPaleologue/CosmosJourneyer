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

import { type LandingPadTexturePool } from "@/frontend/assets/landingPadTexturePool";
import { type PBRTextures } from "@/frontend/assets/textures/materials";
import {
    add,
    div,
    f,
    length,
    min,
    mix,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
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
    vec,
    vec2,
    vertexAttribute,
    xz,
} from "@/frontend/helpers/bsl";

import { Settings } from "@/settings";

export class LandingPadMaterial extends NodeMaterial {
    constructor(padNumber: number, textures: PBRTextures, texturePool: LandingPadTexturePool, scene: Scene) {
        super(`LandingPadMaterial${padNumber}`, scene);
        this.mode = NodeMaterialModes.Material;

        const numberTexture = texturePool.get(padNumber, scene);

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

        //float paintWeight = texture(numberTexture, vec2(vUV.y, vUV.x + 0.01)).a;
        const paintMaskUV = vec2(uvSplit.y, add(uvSplit.x, f(0.01)));
        const paintWeight = textureSample(numberTexture, paintMaskUV).a;

        const paintAlbedo = vec(Vector3.One());

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

        const circleMask = mul(
            step(sub(circleRadius, circleThickness), distToCenter),
            step(distToCenter, add(circleRadius, circleThickness)),
        );

        const fullPaintWeight = add(add(paintWeight, borderWeight), circleMask);

        const albedoTexture = textureSample(textures.albedo, proceduralUV, {
            convertToLinearSpace: true,
        });
        const metallicRoughness = textureSample(textures.metallicRoughness, proceduralUV);
        const normalMapValue = textureSample(textures.normal, proceduralUV);
        const ambientOcclusion = textureSample(textures.ambientOcclusion, proceduralUV);

        const finalAlbedo = mix(albedoTexture.rgb, paintAlbedo, fullPaintWeight);
        const finalMetallic = mix(metallicRoughness.r, f(0), fullPaintWeight);
        const finalRoughness = mix(metallicRoughness.g, f(0.7), fullPaintWeight);
        const finalAmbientOcclusion = mix(ambientOcclusion.r, f(1), fullPaintWeight);

        const perturbedNormal = perturbNormal(
            proceduralUV,
            positionW,
            normalW,
            normalMapValue.rgb,
            sub(f(1), mul(fullPaintWeight, f(0.5))),
        );

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrLighting = pbr(finalMetallic, finalRoughness, normalW, view, cameraPosition, positionW, {
            albedoRgb: finalAlbedo,
            ambientOcclusion: finalAmbientOcclusion,
            perturbedNormal: perturbedNormal.output,
        });

        const additionalLight = mul(finalAlbedo, div(f(0.05), add(f(0.05), mul(distToCenter, distToCenter))));

        const fragOutput = outputFragColor(add(pbrLighting.lighting, additionalLight));

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragOutput);
        this.build();
    }
}
