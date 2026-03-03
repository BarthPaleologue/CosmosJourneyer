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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import {
    add,
    distance,
    f,
    instanceAttribute,
    mul,
    oneMinus,
    outputFragColor,
    outputVertexPosition,
    pbr,
    smoothstep,
    splitVec,
    swizzle,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "babylonjs-shading-language";

import type { TerrainTextures } from "@/frontend/assets/textures/terrains";

import { triangleWave3d, triPlanarMaterial } from "@/utils/bslExtensions";

export class TelluricPlanetMaterial2 {
    private readonly material: NodeMaterial;

    constructor(textures: { grass: TerrainTextures }, scene: Scene) {
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
        const normalPlanetSpace = normal;

        const samplePointPlanetSpace = triangleWave3d(positionPlanetSpace, new Vector3(-132.0, 17.0, 53.0), 2048.0);

        const cameraPosition = uniformCameraPosition();
        const distanceToCamera = distance(swizzle(positionW, "xyz"), cameraPosition);

        // Fade normals in the distance to smooth visual noise
        const normalStrength = oneMinus(smoothstep(f(50), f(100), distanceToCamera));

        const {
            albedo: grassAlbedo,
            roughness: grassRoughness,
            metallic: grassMetallic,
            normal: grassNormal,
        } = triPlanarMaterial(textures.grass, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const grassNormalW = transformDirection(world, grassNormal);

        const view = uniformView();
        const pbrShading = pbr(grassMetallic, grassRoughness, normalW, view, cameraPosition, positionW, {
            albedoRgb: grassAlbedo,
            perturbedNormal: grassNormalW,
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
