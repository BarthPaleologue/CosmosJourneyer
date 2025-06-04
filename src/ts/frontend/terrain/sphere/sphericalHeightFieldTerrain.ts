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

import { Quaternion, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { Direction } from "@/utils/direction";

import { type ChunkForgeCompute } from "./chunkForgeCompute";
import { SphericalHeightFieldSide, type ChunkIndices } from "./sphericalHeightFieldSide";

export class SphericalHeightFieldTerrain implements Transformable {
    private readonly transform: TransformNode;

    private readonly sides: [
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
        SphericalHeightFieldSide,
    ];

    constructor(radius: number, scene: Scene) {
        this.transform = new TransformNode("SphericalHeightFieldTerrain", scene);
        this.transform.rotationQuaternion = Quaternion.Identity();

        const indices: ChunkIndices = {
            x: 0,
            y: 0,
            lod: 0,
        };

        this.sides = [
            new SphericalHeightFieldSide(indices, Direction.UP, radius, this.getTransform(), scene),
            new SphericalHeightFieldSide(indices, Direction.DOWN, radius, this.getTransform(), scene),
            new SphericalHeightFieldSide(indices, Direction.FORWARD, radius, this.getTransform(), scene),
            new SphericalHeightFieldSide(indices, Direction.BACKWARD, radius, this.getTransform(), scene),
            new SphericalHeightFieldSide(indices, Direction.LEFT, radius, this.getTransform(), scene),
            new SphericalHeightFieldSide(indices, Direction.RIGHT, radius, this.getTransform(), scene),
        ];
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    update(cameraPosition: Vector3, chunkForge: ChunkForgeCompute) {
        for (const side of this.sides) {
            side.update(cameraPosition, chunkForge);
        }
    }

    dispose(): void {
        for (const side of this.sides) {
            side.dispose();
        }

        this.transform.dispose();
    }
}
