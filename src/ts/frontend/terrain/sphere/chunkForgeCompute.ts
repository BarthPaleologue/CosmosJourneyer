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

import { type CustomTerrainModel, type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { type IPlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";

import { LRUMap } from "@/utils/dataStructures/lruMap";
import { type Direction } from "@/utils/direction";
import { err, ok, type PowerOfTwo, type Result } from "@/utils/types";

import { Settings } from "@/settings";

import { SquareGridIndicesComputer } from "../squareGridIndexComputer";
import { SquareGridNormalComputer } from "../squareGridNormalComputer";
import {
    type ChunkForge,
    type ChunkForgeOutput,
    type ChunkId,
    type Custom1x1HeightFieldTask,
    type Custom2x4HeightFieldTask,
    type HeightFieldTask,
    type ProceduralHeightFieldTask,
} from "./chunkForge";
import { SphericalHeightFieldBuilder1x1 } from "./sphericalHeightFieldBuilder1x1";
import { SphericalHeightFieldBuilder2x4 } from "./sphericalHeightFieldBuilder2x4";
import { SphericalProceduralHeightFieldBuilder } from "./sphericalProceduralHeightFieldBuilder";
import { WorkerPool } from "./workerPool";

type NormalTask = {
    id: ChunkId;
    positions: { gpu: StorageBuffer; cpu: Float32Array };
};

type ApplyTask = NormalTask & {
    normals: { gpu: StorageBuffer; cpu: Float32Array };
};

type ProceduralHeightFieldComputePool = WorkerPool<
    ProceduralHeightFieldTask,
    SphericalProceduralHeightFieldBuilder,
    NormalTask
>;

type Custom1x1HeightFieldComputePool = WorkerPool<Custom1x1HeightFieldTask, SphericalHeightFieldBuilder1x1, NormalTask>;

type Custom2x4HeightFieldComputePool = WorkerPool<Custom2x4HeightFieldTask, SphericalHeightFieldBuilder2x4, NormalTask>;

type NormalComputePool = WorkerPool<NormalTask, SquareGridNormalComputer, ApplyTask>;

type ChunkCache = {
    positions: LRUMap<ChunkId, { gpu: StorageBuffer; cpu: Float32Array }>;
    normals: LRUMap<ChunkId, { gpu: StorageBuffer; cpu: Float32Array }>;
};

/**
 * ChunkForgeCompute is responsible for creating vertex data for spherical height field terrain chunks.
 * This implementation uses WebGPU compute shaders.
 */
export class ChunkForgeCompute implements ChunkForge {
    private readonly proceduralHeightFieldComputePool: ProceduralHeightFieldComputePool;
    private readonly custom1x1HeightFieldComputePool: Custom1x1HeightFieldComputePool;
    private readonly custom2x4HeightFieldComputePool: Custom2x4HeightFieldComputePool;

    private readonly normalComputePool: NormalComputePool;

    private readonly gridIndices: {
        gpu: StorageBuffer;
        cpu: Uint32Array;
    };

    private readonly cache: ChunkCache;

    private readonly outputs: Map<ChunkId, ChunkForgeOutput>;

    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly heightMapAtlas: IPlanetHeightMapAtlas;

    readonly rowVertexCount: PowerOfTwo;

    /**
     * Creates a new instance of ChunkForgeCompute.
     * @param nbComputeShaders The number of compute shaders that can be dispatched in parallel.
     * @param rowVertexCount The number of vertices in a row of the height field.
     * @param heightMapAtlas The atlas providing height maps for custom terrain models.
     * @param engine A WebGPUEngine instance to use for GPU operations.
     * @returns A promise wrapping a Result containing the ChunkForgeCompute instance or an error.
     */
    public static async New(
        nbComputeShaders: number,
        rowVertexCount: PowerOfTwo,
        heightMapAtlas: IPlanetHeightMapAtlas,
        engine: WebGPUEngine,
    ): Promise<Result<ChunkForgeCompute, unknown>> {
        try {
            return ok(await ChunkForgeCompute.NewUnsafe(nbComputeShaders, rowVertexCount, heightMapAtlas, engine));
        } catch (error) {
            console.error("Failed to create ChunkForgeCompute:", error);
            return err(error);
        }
    }

    private static async NewUnsafe(
        nbComputeShaders: number,
        rowVertexCount: PowerOfTwo,
        heightMapAtlas: IPlanetHeightMapAtlas,
        engine: WebGPUEngine,
    ) {
        const outputs = new Map<ChunkId, ChunkForgeOutput>();
        const cache: ChunkCache = {
            positions: new LRUMap(Settings.MAX_CACHED_CHUNKS, (chunkId, positions) => {
                positions.gpu.getBuffer().references--;
                if (positions.gpu.getBuffer().references === 0) {
                    positions.gpu.dispose();
                }
                outputs.delete(chunkId); // Remove from outputs when cache is cleared
            }),
            normals: new LRUMap(Settings.MAX_CACHED_CHUNKS, (chunkId, normals) => {
                normals.gpu.getBuffer().references--;
                if (normals.gpu.getBuffer().references === 0) {
                    normals.gpu.dispose();
                }
                outputs.delete(chunkId); // Remove from outputs when cache is cleared
            }),
        };

        const proceduralHeightFieldComputePool: ProceduralHeightFieldComputePool = await WorkerPool.New(
            nbComputeShaders,
            () => {
                return SphericalProceduralHeightFieldBuilder.New(engine);
            },
            async (worker, task) => {
                const cachedValue = cache.positions.get(task.id);
                if (cachedValue !== undefined) {
                    return {
                        id: task.id,
                        positions: cachedValue,
                    };
                }

                const positionsGpu = worker.dispatch(
                    task.positionOnCube,
                    task.positionOnSphere,
                    rowVertexCount,
                    task.direction,
                    task.sphereRadius,
                    task.size,
                    task.terrainModel,
                    engine,
                );

                const positionBufferView = await positionsGpu.read();

                const positions = {
                    gpu: positionsGpu,
                    cpu: new Float32Array(positionBufferView.buffer),
                };

                cache.positions.set(task.id, positions);

                return {
                    id: task.id,
                    positions,
                };
            },
        );

        const custom1x1HeightFieldComputePool: Custom1x1HeightFieldComputePool = await WorkerPool.New(
            nbComputeShaders,
            () => {
                return SphericalHeightFieldBuilder1x1.New(engine);
            },
            async (worker, task) => {
                const cachedValue = cache.positions.get(task.id);
                if (cachedValue !== undefined) {
                    return {
                        id: task.id,
                        positions: cachedValue,
                    };
                }

                const positionsGpu = worker.dispatch(
                    task.positionOnCube,
                    task.positionOnSphere,
                    rowVertexCount,
                    task.direction,
                    task.sphereRadius,
                    task.size,
                    {
                        maxHeight: task.heightRange.max,
                        minHeight: task.heightRange.min,
                        heightMap: task.heightMap,
                    },
                    engine,
                );

                const positionBufferView = await positionsGpu.read();

                const positions = {
                    gpu: positionsGpu,
                    cpu: new Float32Array(positionBufferView.buffer),
                };

                cache.positions.set(task.id, positions);

                return {
                    id: task.id,
                    positions,
                };
            },
        );

        const custom2x4HeightFieldComputePool: Custom2x4HeightFieldComputePool = await WorkerPool.New(
            nbComputeShaders,
            () => {
                return SphericalHeightFieldBuilder2x4.New(engine);
            },
            async (worker, task) => {
                const cachedValue = cache.positions.get(task.id);
                if (cachedValue !== undefined) {
                    return {
                        id: task.id,
                        positions: cachedValue,
                    };
                }

                const positionsGpu = worker.dispatch(
                    task.positionOnCube,
                    task.positionOnSphere,
                    rowVertexCount,
                    task.direction,
                    task.sphereRadius,
                    task.size,
                    {
                        maxHeight: task.heightRange.max,
                        minHeight: task.heightRange.min,
                        heightMap: task.heightMap,
                    },
                    engine,
                );

                const positionBufferView = await positionsGpu.read();

                const positions = {
                    gpu: positionsGpu,
                    cpu: new Float32Array(positionBufferView.buffer),
                };

                cache.positions.set(task.id, positions);

                return {
                    id: task.id,
                    positions,
                };
            },
        );

        const normalComputePool: NormalComputePool = await WorkerPool.New(
            nbComputeShaders,
            () => {
                return SquareGridNormalComputer.New(engine);
            },
            async (worker, task) => {
                const cachedValue = cache.normals.get(task.id);
                if (cachedValue !== undefined) {
                    return {
                        id: task.id,
                        normals: cachedValue,
                        positions: task.positions,
                    };
                }

                const normalsGpu = worker.dispatch(rowVertexCount, task.positions.gpu, engine);

                const normalBufferView = await normalsGpu.read();

                const normals = {
                    gpu: normalsGpu,
                    cpu: new Float32Array(normalBufferView.buffer),
                };

                cache.normals.set(task.id, normals);

                return {
                    id: task.id,
                    normals,
                    positions: task.positions,
                };
            },
        );

        const gridIndicesComputer = await SquareGridIndicesComputer.New(engine);

        const gridIndicesBuffer = gridIndicesComputer.dispatch(rowVertexCount, engine);

        const gridIndexBufferView = await gridIndicesBuffer.read();

        const gridIndexBufferCpu = new Uint32Array(gridIndexBufferView.buffer);

        return new ChunkForgeCompute(
            {
                heightFieldProcedural: proceduralHeightFieldComputePool,
                heightField1x1: custom1x1HeightFieldComputePool,
                heightField2x4: custom2x4HeightFieldComputePool,
                normal: normalComputePool,
            },
            {
                gpu: gridIndicesBuffer,
                cpu: gridIndexBufferCpu,
            },
            outputs,
            cache,
            rowVertexCount,
            heightMapAtlas,
        );
    }

    private constructor(
        computers: {
            heightFieldProcedural: ProceduralHeightFieldComputePool;
            heightField1x1: Custom1x1HeightFieldComputePool;
            heightField2x4: Custom2x4HeightFieldComputePool;
            normal: NormalComputePool;
        },
        indices: {
            gpu: StorageBuffer;
            cpu: Uint32Array;
        },
        outputs: Map<ChunkId, ChunkForgeOutput>,
        cache: ChunkCache,
        rowVertexCount: PowerOfTwo,
        heightMapAtlas: IPlanetHeightMapAtlas,
    ) {
        this.proceduralHeightFieldComputePool = computers.heightFieldProcedural;
        this.custom1x1HeightFieldComputePool = computers.heightField1x1;
        this.custom2x4HeightFieldComputePool = computers.heightField2x4;

        this.normalComputePool = computers.normal;

        this.gridIndices = indices;

        this.heightMapAtlas = heightMapAtlas;

        this.outputs = outputs;
        this.cache = cache;

        this.rowVertexCount = rowVertexCount;
    }

    /**
     * @inheritdoc
     */
    public pushTask(
        id: ChunkId,
        positionOnCube: Vector3,
        positionOnSphere: Vector3,
        direction: Direction,
        size: number,
        sphereRadius: number,
        terrainModel: TerrainModel,
    ): void {
        this.outputs.set(id, {
            type: "chunkForgePendingOutput",
        });

        const buildTask = {
            id,
            positionOnCube,
            positionOnSphere,
            direction,
            size,
            sphereRadius,
        } satisfies HeightFieldTask;

        switch (terrainModel.type) {
            case "procedural":
                this.proceduralHeightFieldComputePool.push({ ...buildTask, terrainModel });
                break;
            case "custom":
                this.addCustomHeightFieldTask(buildTask, terrainModel);
                break;
        }
    }

    private addCustomHeightFieldTask(baseTask: HeightFieldTask, terrainModel: CustomTerrainModel): void {
        const heightMap = this.heightMapAtlas.getHeightMap(terrainModel.id);
        switch (heightMap.type) {
            case "1x1":
                this.custom1x1HeightFieldComputePool.push({
                    ...baseTask,
                    heightRange: terrainModel.heightRange,
                    heightMap: heightMap,
                });
                break;
            case "2x4":
                this.custom2x4HeightFieldComputePool.push({
                    ...baseTask,
                    heightRange: terrainModel.heightRange,
                    heightMap: heightMap,
                });
                break;
        }
    }

    private updatePositions() {
        this.proceduralHeightFieldComputePool.update();
        const proceduralHeightFieldOutputs = this.proceduralHeightFieldComputePool.consumeOutputs();
        this.normalComputePool.push(...proceduralHeightFieldOutputs);

        this.custom2x4HeightFieldComputePool.update();
        const custom2x4HeightFieldOutputs = this.custom2x4HeightFieldComputePool.consumeOutputs();
        this.normalComputePool.push(...custom2x4HeightFieldOutputs);

        this.custom1x1HeightFieldComputePool.update();
        const custom1x1HeightFieldOutputs = this.custom1x1HeightFieldComputePool.consumeOutputs();
        this.normalComputePool.push(...custom1x1HeightFieldOutputs);
    }

    private updateNormals() {
        this.normalComputePool.update();
        const normalOutputs = this.normalComputePool.consumeOutputs();
        this.applyQueue.push(...normalOutputs);
    }

    private applyAllReady() {
        while (this.applyQueue.length > 0) {
            const nextTask = this.applyQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            this.outputs.set(nextTask.id, {
                type: "chunkForgeFinalOutput",
                positions: nextTask.positions,
                normals: nextTask.normals,
                indices: this.gridIndices,
            });
        }
    }

    /**
     * @inheritdoc
     */
    public update() {
        this.updatePositions();
        this.updateNormals();
        this.applyAllReady();
    }

    /**
     * @inheritdoc
     */
    public reset() {
        const proceduralHeightFieldOutputs = this.proceduralHeightFieldComputePool.consumeOutputs();
        for (const output of proceduralHeightFieldOutputs) {
            output.positions.gpu.dispose();
        }
        this.proceduralHeightFieldComputePool.reset();

        const custom1x1HeightFieldOutputs = this.custom1x1HeightFieldComputePool.consumeOutputs();
        for (const output of custom1x1HeightFieldOutputs) {
            output.positions.gpu.dispose();
        }
        this.custom1x1HeightFieldComputePool.reset();

        const custom2x4HeightFieldOutputs = this.custom2x4HeightFieldComputePool.consumeOutputs();
        for (const output of custom2x4HeightFieldOutputs) {
            output.positions.gpu.dispose();
        }
        this.custom2x4HeightFieldComputePool.reset();

        const normalOutputs = this.normalComputePool.consumeOutputs();
        for (const output of normalOutputs) {
            output.normals.gpu.dispose();
            output.positions.gpu.dispose();
        }
        this.normalComputePool.reset();

        this.cache.positions.clear();
        this.cache.normals.clear();

        this.outputs.clear();

        this.applyQueue.length = 0;
    }

    /**
     * @inheritdoc
     */
    public getOutput(id: ChunkId): ChunkForgeOutput | undefined {
        return this.outputs.get(id);
    }
}
