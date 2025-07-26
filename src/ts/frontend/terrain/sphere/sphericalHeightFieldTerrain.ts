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

import { type Material } from "@babylonjs/core/Materials/material";
import { Quaternion, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { Direction } from "@/utils/direction";
import { type FixedLengthArray } from "@/utils/types";

import { type ChunkForgeCompute } from "./chunkForgeCompute";
import { SphericalHeightFieldChunk, type ChunkIndices } from "./sphericalHeightFieldChunk";

export class SphericalHeightFieldTerrain implements Transformable {
    private readonly transform: TransformNode;

    private readonly sides: FixedLengthArray<SphericalHeightFieldChunk, 6>;

    constructor(radius: number, material: Material, scene: Scene) {
        this.transform = new TransformNode("SphericalHeightFieldTerrain", scene);
        this.transform.rotationQuaternion = Quaternion.Identity();

        const indices: ChunkIndices = {
            x: 0,
            y: 0,
            lod: 0,
        };

        this.sides = [
            new SphericalHeightFieldChunk(indices, Direction.UP, radius, this.getTransform(), material, scene),
            new SphericalHeightFieldChunk(indices, Direction.DOWN, radius, this.getTransform(), material, scene),
            new SphericalHeightFieldChunk(indices, Direction.FORWARD, radius, this.getTransform(), material, scene),
            new SphericalHeightFieldChunk(indices, Direction.BACKWARD, radius, this.getTransform(), material, scene),
            new SphericalHeightFieldChunk(indices, Direction.LEFT, radius, this.getTransform(), material, scene),
            new SphericalHeightFieldChunk(indices, Direction.RIGHT, radius, this.getTransform(), material, scene),
        ];
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    update(cameraPosition: Vector3, material: Material, chunkForge: ChunkForgeCompute) {
        for (const side of this.sides) {
            side.update(cameraPosition, material, chunkForge);
        }
    }

    dispose(): void {
        for (const side of this.sides) {
            side.dispose();
        }

        this.transform.dispose();
    }
}
