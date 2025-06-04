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
import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";

import { type Direction } from "@/utils/direction";

import { SquareGridNormalComputer } from "../squareGridNormalComputer";
import { SphericalProceduralHeightFieldBuilder } from "./sphericalProceduralHeightFieldBuilder";

type HeightFieldTask = {
    mesh: Mesh;
    positionOnCube: Vector3;
    size: number;
    direction: Direction;
    sphereRadius: number;
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

    private constructor(
        heightFieldComputers: ReadonlyArray<SphericalProceduralHeightFieldBuilder>,
        normalComputers: ReadonlyArray<SquareGridNormalComputer>,
        rowVertexCount: number,
        engine: WebGPUEngine,
    ) {
        this.availableHeightFieldComputers.push(...heightFieldComputers);
        this.availableNormalComputers.push(...normalComputers);
        this.rowVertexCount = rowVertexCount;
        this.engine = engine;
    }

    static async New(nbComputeShaders: number, rowVertexCount: number, engine: WebGPUEngine) {
        const heightFieldComputers: Array<SphericalProceduralHeightFieldBuilder> = [];
        const normalComputers: Array<SquareGridNormalComputer> = [];

        for (let i = 0; i < nbComputeShaders; i++) {
            heightFieldComputers.push(await SphericalProceduralHeightFieldBuilder.New(engine));
            normalComputers.push(await SquareGridNormalComputer.New(engine));
        }

        return new ChunkForgeCompute(heightFieldComputers, normalComputers, rowVertexCount, engine);
    }

    addBuildTask(mesh: Mesh, positionOnCube: Vector3, direction: Direction, size: number, sphereRadius: number): void {
        this.heightFieldQueue.push({ mesh, positionOnCube, direction, size, sphereRadius });
    }

    update() {
        for (const availableComputer of this.availableHeightFieldComputers) {
            const nextTask = this.heightFieldQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const { positions, indices } = availableComputer.dispatch(
                nextTask.positionOnCube,
                this.rowVertexCount,
                nextTask.direction,
                nextTask.sphereRadius,
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

            const normals = availableComputer.dispatch(this.rowVertexCount, nextTask.positions, this.engine);

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
                true,
            );
        }
    }
}
