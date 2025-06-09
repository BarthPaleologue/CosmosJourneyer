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

import { type StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { type WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

import { type Direction } from "@/utils/direction";

import { SquareGridIndicesComputer } from "../squareGridIndexComputer";
import { SquareGridNormalComputer } from "../squareGridNormalComputer";
import { SphericalProceduralHeightFieldBuilder } from "./sphericalProceduralHeightFieldBuilder";

type HeightFieldTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    positionOnCube: Vector3;
    size: number;
    direction: Direction;
    sphereRadius: number;
};

type NormalTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    positions: StorageBuffer;
};

type ApplyTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    positions: StorageBuffer;
    normals: StorageBuffer;
};

export type ChunkForgeOutput = {
    cpu: VertexData;
    gpu: {
        positions: StorageBuffer;
        normals: StorageBuffer;
        indices: StorageBuffer;
    };
};

export class ChunkForgeCompute {
    private readonly availableHeightFieldComputers: Array<SphericalProceduralHeightFieldBuilder> = [];
    private readonly availableNormalComputers: Array<SquareGridNormalComputer> = [];

    private readonly gridIndicesBufferCpu: Uint32Array;
    private readonly gridIndicesBuffer: StorageBuffer;

    private readonly heightFieldQueue: Array<HeightFieldTask> = [];
    private readonly normalQueue: Array<NormalTask> = [];
    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly engine: WebGPUEngine;

    readonly rowVertexCount: number;

    private constructor(
        heightFieldComputers: ReadonlyArray<SphericalProceduralHeightFieldBuilder>,
        normalComputers: ReadonlyArray<SquareGridNormalComputer>,
        gridIndicesBufferCpu: Uint32Array,
        gridIndicesBuffer: StorageBuffer,
        rowVertexCount: number,
        engine: WebGPUEngine,
    ) {
        this.availableHeightFieldComputers.push(...heightFieldComputers);
        this.availableNormalComputers.push(...normalComputers);

        this.gridIndicesBufferCpu = gridIndicesBufferCpu;
        this.gridIndicesBuffer = gridIndicesBuffer;

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

        const gridIndicesComputer = await SquareGridIndicesComputer.New(engine);

        const gridIndicesBuffer = gridIndicesComputer.dispatch(rowVertexCount, engine);

        const gridIndexBufferView = await gridIndicesBuffer.read();

        const gridIndexBufferCpu = new Uint32Array(gridIndexBufferView.buffer);

        return new ChunkForgeCompute(
            heightFieldComputers,
            normalComputers,
            gridIndexBufferCpu,
            gridIndicesBuffer,
            rowVertexCount,
            engine,
        );
    }

    addBuildTask(
        onFinish: (output: ChunkForgeOutput) => void,
        positionOnCube: Vector3,
        direction: Direction,
        size: number,
        sphereRadius: number,
    ): void {
        this.heightFieldQueue.push({ onFinish, positionOnCube, direction, size, sphereRadius });
    }

    update() {
        for (const availableComputer of this.availableHeightFieldComputers) {
            const nextTask = this.heightFieldQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const positions = availableComputer.dispatch(
                nextTask.positionOnCube,
                this.rowVertexCount,
                nextTask.direction,
                nextTask.sphereRadius,
                nextTask.size,
                this.engine,
            );

            this.normalQueue.push({
                onFinish: nextTask.onFinish,
                positions,
            });
        }

        for (const availableComputer of this.availableNormalComputers) {
            const nextTask = this.normalQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            const normals = availableComputer.dispatch(this.rowVertexCount, nextTask.positions, this.engine);

            this.applyQueue.push({
                onFinish: nextTask.onFinish,
                positions: nextTask.positions,
                normals,
            });
        }

        while (this.applyQueue.length > 0) {
            const nextTask = this.applyQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            void this.runApplyTask(nextTask);
        }
    }

    private async runApplyTask(task: ApplyTask) {
        const { onFinish, positions, normals } = task;

        const positionBufferView = await positions.read();
        const normalBufferView = await normals.read();

        const vertexData = new VertexData();
        vertexData.positions = new Float32Array(positionBufferView.buffer);
        vertexData.indices = this.gridIndicesBufferCpu;
        vertexData.normals = new Float32Array(normalBufferView.buffer);

        onFinish({
            cpu: vertexData,
            gpu: {
                positions,
                normals,
                indices: this.gridIndicesBuffer,
            },
        });
    }
}
