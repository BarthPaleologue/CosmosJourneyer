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
import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialModes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialModes";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { Textures } from "../assets/textures";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { MultiplyBlock } from "@babylonjs/core/Materials/Node/Blocks/multiplyBlock";
import * as BSL from "../utils/bsl";

export class ClimberRingMaterial extends NodeMaterial {
    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.mode = NodeMaterialModes.Material;

        // Vertex

        const position = BSL.vertexAttribute("position");
        const normal = BSL.vertexAttribute("normal");
        const meshUV = BSL.vertexAttribute("uv");

        const world = BSL.uniformWorld();

        const positionW = BSL.transformPosition(world, position, BSL.Stage.VERT);

        const viewProjection = BSL.uniformViewProjection();

        const positionClipSpace = BSL.transformPosition(viewProjection, positionW, BSL.Stage.VERT);

        const vertexOutput = BSL.outputVertexPosition(positionClipSpace);

        // Fragment

        const normalW = BSL.transformDirection(world, normal, BSL.Stage.FRAG);

        const meshUVScaleFactor = BSL.vecFromBabylon(new Vector2(2, 10));

        const scaledMeshUV = BSL.mulVec(meshUV, meshUVScaleFactor, BSL.Stage.FRAG);

        const uv = BSL.fract(scaledMeshUV, BSL.Stage.FRAG);

        const albedoTexture = BSL.sampleTexture(Textures.CRATE_ALBEDO, uv, true);
        const metallicRoughnesstexture = BSL.sampleTexture(Textures.CRATE_METALLIC_ROUGHNESS, uv, false);
        const aoTexture = BSL.sampleTexture(Textures.CRATE_AMBIENT_OCCLUSION, uv, false);
        const normalTexture = BSL.sampleTexture(Textures.CRATE_NORMAL, uv, false);

        const perturbedNormal = BSL.perturbNormal(uv, positionW, normalW, normalTexture.rgb, BSL.float(1));

        const view = BSL.uniformView();

        const cameraPosition = BSL.uniformCameraPosition();

        const pbrColor = BSL.pbrMetallicRoughnessMaterial(
            albedoTexture.rgb,
            metallicRoughnesstexture.r,
            metallicRoughnesstexture.g,
            aoTexture.r,
            perturbedNormal,
            normalW,
            view,
            cameraPosition,
            positionW
        );

        const fragmentOutput = BSL.outputFragColor(pbrColor);

        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);
        this.build();
    }
}
