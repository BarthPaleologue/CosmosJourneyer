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

import { type Direction } from "@/utils/direction";

import { SquareGridNormalComputer } from "../squareGridNormalComputer";
import { SphericalProceduralHeightFieldBuilder } from "./sphericalProceduralHeightFieldBuilder";

type HeightFieldTask = {
    mesh: Mesh;
    size: number;
    direction: Direction;
};

type NormalTask = {
    mesh: Mesh;
    positions: StorageBuffer;
    indices: StorageBuffer;
};

type ApplyTask = {
    mesh: Mesh;
    positions: StorageBuffer;
    indices: StorageBuffer;
    normals: StorageBuffer;
};

export class ChunkForgeCompute {
    private readonly availableHeightFieldComputers: Array<SphericalProceduralHeightFieldBuilder> = [];
    private readonly availableNormalComputers: Array<SquareGridNormalComputer> = [];

    private readonly heightFieldQueue: Array<HeightFieldTask> = [];
    private readonly normalQueue: Array<NormalTask> = [];
    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly engine: WebGPUEngine;

    private readonly rowVertexCount: number;

    constructor(nbComputeShaders: number, rowVertexCount: number, engine: WebGPUEngine) {
        for (let i = 0; i < nbComputeShaders; i++) {
            this.availableHeightFieldComputers.push(new SphericalProceduralHeightFieldBuilder(engine));
            this.availableNormalComputers.push(new SquareGridNormalComputer(engine));
        }

        this.rowVertexCount = rowVertexCount;
        this.engine = engine;
    }

    addBuildTask(mesh: Mesh, direction: Direction, size: number): void {
        this.heightFieldQueue.push({ mesh, direction, size });
    }

    async update(): Promise<void> {
        for (const availableComputer of this.availableHeightFieldComputers) {
            const nextTask = this.heightFieldQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            console.log("Dispatching height field task for mesh:", nextTask.mesh.name);

            const { positions, indices } = await availableComputer.dispatch(
                this.rowVertexCount,
                nextTask.direction,
                nextTask.size,
                this.engine,
            );

            this.normalQueue.push({
                mesh: nextTask.mesh,
                positions,
                indices,
            });
        }

        for (const availableComputer of this.availableNormalComputers) {
            const nextTask = this.normalQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            console.log("Dispatching normal computation task for mesh:", nextTask.mesh.name);

            const normals = await availableComputer.dispatch(this.rowVertexCount, nextTask.positions, this.engine);

            this.applyQueue.push({
                mesh: nextTask.mesh,
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

            console.log("Applying computed buffers to mesh:", nextTask.mesh.name);

            const { mesh, positions, indices, normals } = nextTask;

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
                this.rowVertexCount * this.rowVertexCount,
                (this.rowVertexCount - 1) * (this.rowVertexCount - 1) * 6,
            );
        }
    }
}
