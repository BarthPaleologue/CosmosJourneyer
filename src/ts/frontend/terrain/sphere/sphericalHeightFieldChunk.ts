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

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { getQuaternionFromDirection, type Direction } from "@/utils/direction";
import { type FixedLengthArray } from "@/utils/types";

import { type ChunkForgeCompute, type ChunkForgeOutput } from "./chunkForgeCompute";

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

export class SphericalHeightFieldChunk {
    readonly mesh: Mesh;

    private readonly direction: Direction;

    private readonly radius: number;

    private readonly size: number;

    private status: ChunkLoadingStatus = ChunkLoadingStatus.NOT_STARTED;

    private indices: ChunkIndices;

    private children: FixedLengthArray<SphericalHeightFieldChunk, 4> | null = null;

    private readonly parent: TransformNode;

    private readonly positionOnCube: Vector3;

    private vertexData: ChunkForgeOutput | null = null;

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

        this.size = (radius * 2) / 2 ** indices.lod;
    }

    setVertexData(vertexData: ChunkForgeOutput, rowVertexCount: number, engine: AbstractEngine) {
        const positionsVertexBuffer = new VertexBuffer(
            engine,
            vertexData.gpu.positions.getBuffer(),
            "position",
            false,
            false,
            3,
        );

        this.mesh.setVerticesBuffer(positionsVertexBuffer);

        const normalsVertexBuffer = new VertexBuffer(
            engine,
            vertexData.gpu.normals.getBuffer(),
            "normal",
            false,
            false,
            3,
        );
        this.mesh.setVerticesBuffer(normalsVertexBuffer);

        this.mesh.setIndexBuffer(
            vertexData.gpu.indices.getBuffer(),
            rowVertexCount * rowVertexCount,
            (rowVertexCount - 1) * (rowVertexCount - 1) * 6,
            true,
        );

        this.vertexData = vertexData;
    }

    static Subdivide(
        indices: ChunkIndices,
        direction: Direction,
        radius: number,
        parent: TransformNode,
        scene: Scene,
    ): FixedLengthArray<SphericalHeightFieldChunk, 4> {
        return [
            new SphericalHeightFieldChunk(
                {
                    x: indices.x * 2,
                    y: indices.y * 2,
                    lod: indices.lod + 1,
                },
                direction,
                radius,
                parent,
                scene,
            ),
            new SphericalHeightFieldChunk(
                {
                    x: indices.x * 2 + 1,
                    y: indices.y * 2,
                    lod: indices.lod + 1,
                },
                direction,
                radius,
                parent,
                scene,
            ),
            new SphericalHeightFieldChunk(
                {
                    x: indices.x * 2,
                    y: indices.y * 2 + 1,
                    lod: indices.lod + 1,
                },
                direction,
                radius,
                parent,
                scene,
            ),
            new SphericalHeightFieldChunk(
                {
                    x: indices.x * 2 + 1,
                    y: indices.y * 2 + 1,
                    lod: indices.lod + 1,
                },
                direction,
                radius,
                parent,
                scene,
            ),
        ];
    }

    update(cameraPosition: Vector3, chunkForge: ChunkForgeCompute) {
        if (this.status === ChunkLoadingStatus.NOT_STARTED) {
            this.status = ChunkLoadingStatus.IN_PROGRESS;

            chunkForge.addBuildTask(
                (output) => {
                    this.setVertexData(output, chunkForge.rowVertexCount, this.mesh.getScene().getEngine());
                    this.status = ChunkLoadingStatus.COMPLETED;
                    this.mesh.setEnabled(true);
                },
                this.positionOnCube,
                this.direction,
                this.size,
                this.radius,
            );
        }

        const distanceSquared = Vector3.DistanceSquared(this.mesh.getAbsolutePosition(), cameraPosition);
        if (this.children === null && distanceSquared < (this.size * 2) ** 2) {
            this.children = SphericalHeightFieldChunk.Subdivide(
                this.indices,
                this.direction,
                this.radius,
                this.parent,
                this.mesh.getScene(),
            );
        } else if (this.children !== null && distanceSquared >= (this.size * 2.5) ** 2) {
            for (const child of this.children) {
                child.dispose();
            }
            this.children = null;
            this.status = ChunkLoadingStatus.NOT_STARTED;
            this.mesh.setEnabled(true);
        }

        for (const child of this.children ?? []) {
            child.update(cameraPosition, chunkForge);
        }

        if (this.children !== null && this.children.every((child) => child.status === ChunkLoadingStatus.COMPLETED)) {
            this.mesh.setEnabled(false);
        }
    }

    dispose(): void {
        this.mesh.dispose();
        this.children?.forEach((child) => {
            child.dispose();
        });
    }
}
