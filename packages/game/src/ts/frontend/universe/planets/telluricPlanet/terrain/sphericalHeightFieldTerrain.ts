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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Material } from "@babylonjs/core/Materials/material";
import { Quaternion, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly, TelluricPlanetModel, TelluricSatelliteModel } from "@cosmos-journeyer/universe-model";

import type { Cullable } from "@/frontend/helpers/cullable";
import type { Transformable } from "@/frontend/universe/architecture/transformable";

import type { ChunkForge } from "./chunks/chunkForge";
import type { IScatteringSystem } from "./chunks/scatteringSystem";
import { TerrainFaceQuadTree } from "./chunks/terrainFaceQuadTree";

export class SphericalHeightFieldTerrain implements Transformable, Cullable {
    private readonly transform: TransformNode;
    private readonly faces: [
        TerrainFaceQuadTree,
        TerrainFaceQuadTree,
        TerrainFaceQuadTree,
        TerrainFaceQuadTree,
        TerrainFaceQuadTree,
        TerrainFaceQuadTree,
    ];

    constructor(
        model: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        material: Material,
        scene: Scene,
    ) {
        this.transform = new TransformNode(`${model.name}SphericalHeightFieldTerrain`, scene);
        this.transform.rotationQuaternion = Quaternion.Identity();
        this.faces = [
            new TerrainFaceQuadTree("up", model, this.transform, material, scene),
            new TerrainFaceQuadTree("down", model, this.transform, material, scene),
            new TerrainFaceQuadTree("forward", model, this.transform, material, scene),
            new TerrainFaceQuadTree("backward", model, this.transform, material, scene),
            new TerrainFaceQuadTree("right", model, this.transform, material, scene),
            new TerrainFaceQuadTree("left", model, this.transform, material, scene),
        ];
    }

    public updateLOD(observerPosition: Vector3, chunkForge: ChunkForge, scatteringSystem: IScatteringSystem): void {
        for (const face of this.faces) {
            face.updateLOD(observerPosition, chunkForge, scatteringSystem);
        }
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    computeCulling(camera: Camera): void {
        for (const face of this.faces) {
            face.computeCulling(camera);
        }
    }

    dispose() {
        for (const face of this.faces) {
            face.dispose();
        }
        this.transform.dispose();
    }
}
