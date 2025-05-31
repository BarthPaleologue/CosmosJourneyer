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
import { type StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { type WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";

import { PlanarProceduralHeightField } from "../planarProceduralHeightField";
import { SquareGridNormalComputer } from "../squareGridNormalComputer";

type HeightFieldTask = {
    mesh: Mesh;
    rowVertexCount: number;
    size: number;
};

type NormalTask = {
    mesh: Mesh;
    rowVertexCount: number;
    positions: StorageBuffer;
    indices: StorageBuffer;
};

type ApplyTask = {
    mesh: Mesh;
    rowVertexCount: number;
    positions: StorageBuffer;
    indices: StorageBuffer;
    normals: StorageBuffer;
};

export class ChunkForgeCompute {
    private readonly availableHeightFieldComputers: Array<PlanarProceduralHeightField> = [];
    private readonly availableNormalComputers: Array<SquareGridNormalComputer> = [];

    private readonly heightFieldQueue: Array<HeightFieldTask> = [];
    private readonly normalQueue: Array<NormalTask> = [];
    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly engine: WebGPUEngine;

    constructor(nbComputeShaders: number, engine: WebGPUEngine) {
        for (let i = 0; i < nbComputeShaders; i++) {
            this.availableHeightFieldComputers.push(new PlanarProceduralHeightField(engine));
            this.availableNormalComputers.push(new SquareGridNormalComputer(engine));
        }

        this.engine = engine;
    }

    addBuildTask(mesh: Mesh, rowVertexCount: number, size: number): void {
        this.heightFieldQueue.push({ mesh, rowVertexCount, size });
    }

    async update(): Promise<void> {
        for (const availableComputer of this.availableHeightFieldComputers) {
            const nextTask = this.heightFieldQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const { positions, indices } = await availableComputer.dispatch(
                nextTask.rowVertexCount,
                nextTask.size,
                this.engine,
            );

            this.normalQueue.push({
                mesh: nextTask.mesh,
                rowVertexCount: nextTask.rowVertexCount,
                positions,
                indices,
            });
        }

        for (const availableComputer of this.availableNormalComputers) {
            const nextTask = this.normalQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const normals = await availableComputer.dispatch(nextTask.rowVertexCount, nextTask.positions, this.engine);

            this.applyQueue.push({
                mesh: nextTask.mesh,
                rowVertexCount: nextTask.rowVertexCount,
                positions: nextTask.positions,
                indices: nextTask.indices,
                normals,
            });
        }

        while (this.applyQueue.length > 0) {
            const nextTask = this.applyQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const { mesh, positions, indices, normals, rowVertexCount } = nextTask;

            const positionsVertexBuffer = new VertexBuffer(
                this.engine,
                positions.getBuffer(),
                "position",
                false,
                false,
                3,
            );
            mesh.setVerticesBuffer(positionsVertexBuffer);

            const normalsVertexBuffer = new VertexBuffer(this.engine, normals.getBuffer(), "normal", false, false, 3);
            mesh.setVerticesBuffer(normalsVertexBuffer);

            mesh.setIndexBuffer(
                indices.getBuffer(),
                rowVertexCount * rowVertexCount,
                (rowVertexCount - 1) * (rowVertexCount - 1) * 6,
            );
        }
    }
}
