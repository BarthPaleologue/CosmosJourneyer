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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { getQuaternionFromDirection, type Direction } from "@/utils/direction";

import { type ChunkForgeCompute } from "./chunkForgeCompute";

const ChunkLoadingStatus = {
    NOT_STARTED: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
} as const;

type ChunkLoadingStatus = (typeof ChunkLoadingStatus)[keyof typeof ChunkLoadingStatus];

export class SphericalHeightFieldSide {
    readonly mesh: Mesh;

    private readonly direction: Direction;

    private readonly radius: number;

    private status: ChunkLoadingStatus = ChunkLoadingStatus.NOT_STARTED;

    constructor(direction: Direction, radius: number, parent: TransformNode, scene: Scene) {
        this.mesh = new Mesh("SphericalHeightFieldSide", scene);
        this.mesh.isPickable = false;
        this.mesh.parent = parent;

        this.mesh.position.z = radius;
        this.mesh.position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.direction = direction;
        this.radius = radius;
    }

    update(chunkForge: ChunkForgeCompute) {
        if (this.status === ChunkLoadingStatus.NOT_STARTED) {
            this.status = ChunkLoadingStatus.IN_PROGRESS;

            chunkForge.addBuildTask(this.mesh, this.direction, this.radius * 2, this.radius);
        }
    }

    dispose(): void {
        this.mesh.dispose();
    }
}
