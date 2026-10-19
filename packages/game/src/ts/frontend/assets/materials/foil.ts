//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024-2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
import type { Scene } from "@babylonjs/core/scene";
import {
    builtinAttribute,
    float,
    getFrontFacing,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    reflection,
    sub,
    swizzle,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
} from "babylonjs-shading-language";

import type { FoilTextures } from "../textures/materials/foil";

export class FoilMaterial {
    private readonly material: NodeMaterial;

    constructor(textures: FoilTextures, scene: Scene) {
        this.material = new NodeMaterial("foil", scene);
        this.material.backFaceCulling = false;
        const position = builtinAttribute("position");
        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, builtinAttribute("normal"));
        const view = uniformView();
        const cameraPosition = uniformCameraPosition();
        // Plane-local XY coordinates preserve a ten-metre repeat for sheets of any size.
        const uv = mul(swizzle(position, "xy"), float(0.1));
        const albedo = textureSample(uniformTexture2d(textures.albedo).source, uv, {
            convertToLinearSpace: true,
        });
        const normalMap = textureSample(uniformTexture2d(textures.normal).source, uv);
        const roughness = textureSample(uniformTexture2d(textures.roughness).source, uv);
        const { output: perturbedNormal } = perturbNormal(uv, positionW, normalW, normalMap.rgb, float(0.2));
        const faceSign = sub(float(1), mul(getFrontFacing(), float(2)));

        const pbrLighting = pbr(float(1), roughness.r, normalW, view, cameraPosition, positionW, {
            albedoRgb: albedo.rgb,
            perturbedNormal: mul(perturbedNormal, faceSign),
            reflection: reflection(position, world),
        });

        const clipPosition = transformPosition(uniformViewProjection(), positionW);
        this.material.addOutputNode(outputVertexPosition(clipPosition));
        this.material.addOutputNode(outputFragColor(pbrLighting.lighting));
        this.material.build();
    }

    get(): NodeMaterial {
        return this.material;
    }

    dispose(): void {
        this.material.dispose();
    }
}
