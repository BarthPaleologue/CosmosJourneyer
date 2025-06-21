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
import { type Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { getQuaternionFromDirection, type Direction } from "@/utils/direction";
import { type FixedLengthArray } from "@/utils/types";

import {
    type ChunkForgeCompute,
    type ChunkForgeFinalOutput,
    type ChunkForgeOutput,
    type ChunkId,
} from "./chunkForgeCompute";

type ChunkLoadingState = "not_started" | "in_progress" | "completed";

export type ChunkIndices = {
    x: number;
    y: number;
    lod: number;
};

export class SphericalHeightFieldChunk {
    private readonly id: ChunkId;

    private readonly mesh: Mesh;

    private readonly direction: Direction;

    private readonly radius: number;

    private readonly size: number;

    private loadingState: ChunkLoadingState = "not_started";

    private readonly indices: ChunkIndices;

    private children: FixedLengthArray<SphericalHeightFieldChunk, 4> | null = null;

    private readonly parent: TransformNode;

    private readonly positionOnCube: Vector3;

    private vertexData: ChunkForgeOutput | null = null;

    private readonly terrainModel: TerrainModel;

    constructor(
        indices: ChunkIndices,
        direction: Direction,
        radius: number,
        parent: TransformNode,
        terrainModel: TerrainModel,
        material: Material,
        scene: Scene,
    ) {
        this.id = `${parent.name}->d${direction}->l${indices.lod}->[x${indices.x};y${indices.y}]`;

        this.mesh = new Mesh(this.id, scene);
        this.mesh.isPickable = false;
        this.mesh.parent = parent;
        this.mesh.material = material;

        this.parent = parent;

        this.indices = { ...indices };

        this.terrainModel = terrainModel;

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

    private setVertexData(vertexData: ChunkForgeFinalOutput, rowVertexCount: number, engine: AbstractEngine) {
        // see https://forum.babylonjs.com/t/how-to-share-webgpu-index-buffer-between-meshes/58902/2
        vertexData.positions.gpu.getBuffer().references++;
        vertexData.normals.gpu.getBuffer().references++;
        vertexData.indices.gpu.getBuffer().references++;

        const positionsVertexBuffer = new VertexBuffer(
            engine,
            vertexData.positions.gpu.getBuffer(),
            "position",
            false,
            false,
            3,
        );

        this.mesh.setVerticesBuffer(positionsVertexBuffer);

        const normalsVertexBuffer = new VertexBuffer(
            engine,
            vertexData.normals.gpu.getBuffer(),
            "normal",
            false,
            false,
            3,
        );
        this.mesh.setVerticesBuffer(normalsVertexBuffer);

        this.mesh.setIndexBuffer(
            vertexData.indices.gpu.getBuffer(),
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
        terrainModel: TerrainModel,
        material: Material,
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
                terrainModel,
                material,
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
                terrainModel,
                material,
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
                terrainModel,
                material,
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
                terrainModel,
                material,
                scene,
            ),
        ];
    }

    private updateLoadingState(chunkForge: ChunkForgeCompute) {
        if (this.loadingState === "completed") {
            return;
        }

        const cachedVertexData = chunkForge.getOutput(this.id);
        if (cachedVertexData !== undefined) {
            if (cachedVertexData.type === "chunkForgePendingOutput") {
                return;
            }

            this.setVertexData(cachedVertexData, chunkForge.rowVertexCount, this.mesh.getScene().getEngine());
            this.loadingState = "completed";
            this.mesh.setEnabled(true);
            return;
        }

        this.loadingState = "in_progress";

        chunkForge.pushTask(
            this.id,
            this.positionOnCube,
            this.mesh.position,
            this.direction,
            this.size,
            this.radius,
            this.terrainModel,
        );
    }

    public update(cameraPosition: Vector3, material: Material, chunkForge: ChunkForgeCompute) {
        this.updateLoadingState(chunkForge);

        const distanceSquared = Vector3.DistanceSquared(this.mesh.getAbsolutePosition(), cameraPosition);
        if (this.children === null && distanceSquared < (this.size * 2) ** 2) {
            this.children = SphericalHeightFieldChunk.Subdivide(
                this.indices,
                this.direction,
                this.radius,
                this.parent,
                this.terrainModel,
                material,
                this.mesh.getScene(),
            );
        } else if (this.children !== null && distanceSquared >= (this.size * 2.5) ** 2) {
            for (const child of this.children) {
                child.dispose();
            }
            this.children = null;
            this.loadingState = "completed";
            this.mesh.setEnabled(true);
        }

        for (const child of this.children ?? []) {
            child.update(cameraPosition, material, chunkForge);
        }

        if (this.children !== null && this.children.every((child) => child.loadingState === "completed")) {
            this.mesh.setEnabled(false);
        }
    }

    public dispose(): void {
        this.mesh.dispose();
        this.children?.forEach((child) => {
            child.dispose();
        });
    }
}
