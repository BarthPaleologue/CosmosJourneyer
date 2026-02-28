//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import {
    add,
    f,
    instanceAttribute,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    splitVec,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "babylonjs-shading-language";

import { triangleWave3d, triPlanarSamples } from "@/utils/bslExtensions";

export class TelluricPlanetMaterial2 {
    private readonly material: NodeMaterial;

    constructor(albedo: Texture, scene: Scene) {
        this.material = new NodeMaterial("TelluricPlanetMaterial", scene);

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");

        // Node material hack: we store the chunk position in the instance color attribute of the mesh
        const chunkPosition = splitVec(instanceAttribute("instanceColor")).xyzOut;

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const positionPlanetSpace = add(position, chunkPosition);

        const triPlanarSamplePoint = triangleWave3d(positionPlanetSpace, new Vector3(-132.0, 17.0, 53.0), 2048.0);
        const grassTriPlanarSamplePoint = mul(triPlanarSamplePoint, f(0.1));

        const albedoTexture = uniformTexture2d(albedo).source;
        const [grassAlbedo] = triPlanarSamples([albedoTexture] as const, grassTriPlanarSamplePoint, normal);

        const cameraPosition = uniformCameraPosition();
        const view = uniformView();
        const pbrShading = pbr(f(0.0), f(0.7), normalW, view, cameraPosition, positionW, {
            albedoRgb: splitVec(grassAlbedo).xyzOut,
        });

        const fragOutput = outputFragColor(pbrShading.lighting);

        this.material.addOutputNode(vertexOutput);
        this.material.addOutputNode(fragOutput);
        this.material.build();
    }

    get() {
        return this.material;
    }

    dispose() {
        this.material.dispose();
    }
}
