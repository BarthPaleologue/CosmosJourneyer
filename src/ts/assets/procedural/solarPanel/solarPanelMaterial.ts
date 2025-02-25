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

import { Scene } from "@babylonjs/core/scene";
import { Textures } from "../../textures";
import { NodeMaterialModes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialModes";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import * as BSL from "../../../utils/bsl";

export class SolarPanelMaterial extends NodeMaterial {
    constructor(scene: Scene) {
        super("SolarPanelNodeMaterial", scene);
        this.mode = NodeMaterialModes.Material;

        // Vertex Shader

        const position = BSL.vertexAttribute("position");
        const normal = BSL.vertexAttribute("normal");

        const positionXZ = BSL.xz(position);
        const uv = BSL.mul(positionXZ, BSL.float(0.01));

        const world = BSL.uniformWorld();
        const positionW = BSL.transformPosition(world, position);
        const normalW = BSL.transformDirection(world, normal);

        const viewProjection = BSL.uniformViewProjection();
        const positionClipSpace = BSL.transformPosition(viewProjection, positionW);

        const vertexOutput = BSL.outputVertexPosition(positionClipSpace);

        // Fragment Shader

        const albedoTexture = BSL.textureSample(Textures.SOLAR_PANEL_ALBEDO, uv, {
            convertToLinearSpace: true
        });
        const metallicRoughness = BSL.textureSample(Textures.SOLAR_PANEL_METALLIC_ROUGHNESS, uv);
        const normalMapValue = BSL.textureSample(Textures.SOLAR_PANEL_NORMAL, uv);

        const perturbedNormal = BSL.perturbNormal(uv, positionW, normalW, normalMapValue.rgb, BSL.float(1));

        const view = BSL.uniformView();
        const cameraPosition = BSL.uniformCameraPosition();

        const pbrLighting = BSL.pbrMetallicRoughnessMaterial(
            albedoTexture.rgb,
            metallicRoughness.r,
            metallicRoughness.g,
            null,
            perturbedNormal,
            normalW,
            view,
            cameraPosition,
            positionW
        );

        const fragOutput = BSL.outputFragColor(pbrLighting);

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragOutput);
        this.build();
    }
}
