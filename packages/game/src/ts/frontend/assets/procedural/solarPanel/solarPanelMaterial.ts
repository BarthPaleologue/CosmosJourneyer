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

import {
    float,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
    xz,
} from "@/frontend/helpers/bsl";

import type { SolarPanelTextures } from "../../textures/materials/solarPanel";

export class SolarPanelMaterial extends NodeMaterial {
    constructor(textures: SolarPanelTextures, scene: Scene) {
        super("SolarPanelNodeMaterial", scene);
        this.mode = NodeMaterialModes.Material;

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");

        const positionXZ = xz(position);
        const uv = mul(positionXZ, float(1));

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const cameraPosition = uniformCameraPosition();

        const normalHeightMapValue = textureSample(textures.normal, uv);
        const { output: perturbedNormal } = perturbNormal(uv, positionW, normalW, normalHeightMapValue.rgb, float(1));

        const sampleUV = uv;

        const albedoTexture = textureSample(textures.albedo, sampleUV, {
            convertToLinearSpace: true,
        });
        const metallic = textureSample(textures.metallic, sampleUV);
        const roughness = textureSample(textures.roughness, sampleUV);

        const view = uniformView();

        const pbrLighting = pbr(metallic.r, roughness.r, perturbedNormal, normalW, view, cameraPosition, positionW, {
            albedoRgb: albedoTexture.rgb,
        });

        const fragOutput = outputFragColor(pbrLighting.lighting);

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragOutput);
        this.build();
    }
}
