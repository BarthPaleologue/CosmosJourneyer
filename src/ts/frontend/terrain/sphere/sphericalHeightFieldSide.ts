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

import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { getQuaternionFromDirection, type Direction } from "@/utils/direction";
import { type FixedLengthArray } from "@/utils/types";

import { type ChunkForgeCompute } from "./chunkForgeCompute";

const ChunkLoadingStatus = {
    NOT_STARTED: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
} as const;

type ChunkLoadingStatus = (typeof ChunkLoadingStatus)[keyof typeof ChunkLoadingStatus];

export type ChunkIndices = {
    x: number;
    y: number;
    lod: number;
};

export class SphericalHeightFieldSide {
    readonly mesh: Mesh;

    private readonly direction: Direction;

    private readonly radius: number;

    private status: ChunkLoadingStatus = ChunkLoadingStatus.NOT_STARTED;

    private indices: ChunkIndices;

    private children: FixedLengthArray<SphericalHeightFieldSide, 4> | null = null;

    private readonly parent: TransformNode;

    private readonly positionOnCube: Vector3;

    constructor(indices: ChunkIndices, direction: Direction, radius: number, parent: TransformNode, scene: Scene) {
        this.mesh = new Mesh(`SphericalHeightFieldSide[${direction};${JSON.stringify(indices)}]`, scene);
        this.mesh.isPickable = false;
        this.mesh.parent = parent;

        this.parent = parent;

        this.indices = indices;

        this.mesh.position.x = -radius + (radius * 2 * indices.x) / 2 ** indices.lod;
        this.mesh.position.y = -radius + (radius * 2 * indices.y) / 2 ** indices.lod;
        this.mesh.position.x += radius / 2 ** indices.lod;
        this.mesh.position.y += radius / 2 ** indices.lod;

        this.mesh.position.z = radius;

        this.mesh.position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.positionOnCube = this.mesh.position.clone();

        this.mesh.position.normalize().scaleInPlace(radius);

        this.direction = direction;
        this.radius = radius;

        if (this.children !== null || this.indices.lod === 2) {
            return;
        }

        this.mesh.setEnabled(false);
        this.children = this.subdivide(this.indices, scene);
    }

    subdivide(indices: ChunkIndices, scene: Scene): FixedLengthArray<SphericalHeightFieldSide, 4> {
        return [
            new SphericalHeightFieldSide(
                {
                    x: indices.x * 2,
                    y: indices.y * 2,
                    lod: indices.lod + 1,
                },
                this.direction,
                this.radius,
                this.parent,
                scene,
            ),
            new SphericalHeightFieldSide(
                {
                    x: indices.x * 2 + 1,
                    y: indices.y * 2,
                    lod: indices.lod + 1,
                },
                this.direction,
                this.radius,
                this.parent,
                scene,
            ),
            new SphericalHeightFieldSide(
                {
                    x: indices.x * 2,
                    y: indices.y * 2 + 1,
                    lod: indices.lod + 1,
                },
                this.direction,
                this.radius,
                this.parent,
                scene,
            ),
            new SphericalHeightFieldSide(
                {
                    x: indices.x * 2 + 1,
                    y: indices.y * 2 + 1,
                    lod: indices.lod + 1,
                },
                this.direction,
                this.radius,
                this.parent,
                scene,
            ),
        ];
    }

    update(chunkForge: ChunkForgeCompute) {
        if (this.status === ChunkLoadingStatus.NOT_STARTED) {
            this.status = ChunkLoadingStatus.IN_PROGRESS;

            chunkForge.addBuildTask(
                this.mesh,
                this.positionOnCube,
                this.direction,
                (this.radius * 2) / 2 ** this.indices.lod,
                this.radius,
            );
        }

        for (const child of this.children ?? []) {
            child.update(chunkForge);
        }
    }

    dispose(): void {
        this.mesh.dispose();
    }
}
