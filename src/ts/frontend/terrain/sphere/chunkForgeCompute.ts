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

import {
    type CustomTerrainModel,
    type ProceduralTerrainModel,
    type TerrainModel,
} from "@/backend/universe/orbitalObjects/terrainModel";

import { type IPlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { type HeightMap1x1, type HeightMap2x4 } from "@/frontend/assets/textures/heightmaps/types";

import { type Direction } from "@/utils/direction";

import { SquareGridIndicesComputer } from "../squareGridIndexComputer";
import { SquareGridNormalComputer } from "../squareGridNormalComputer";
import { SphericalHeightFieldBuilder1x1 } from "./sphericalHeightFieldBuilder1x1";
import { SphericalHeightFieldBuilder2x4 } from "./sphericalHeightFieldBuilder2x4";
import { SphericalProceduralHeightFieldBuilder } from "./sphericalProceduralHeightFieldBuilder";
import { WorkerPool } from "./workerPool";

type ChunkId = string;

type HeightFieldTask = {
    id: ChunkId;
    positionOnCube: Vector3;
    positionOnSphere: Vector3;
    size: number;
    direction: Direction;
    sphereRadius: number;
};

type ProceduralHeightFieldTask = HeightFieldTask & {
    terrainModel: ProceduralTerrainModel;
};

type Custom1x1HeightFieldTask = HeightFieldTask & {
    heightRange: { min: number; max: number };
    heightMap: HeightMap1x1;
};

type Custom2x4HeightFieldTask = HeightFieldTask & {
    heightRange: { min: number; max: number };
    heightMap: HeightMap2x4;
};

type NormalTask = {
    id: ChunkId;
    positions: { gpu: StorageBuffer; cpu: Float32Array };
};

type ApplyTask = {
    id: ChunkId;
    positions: { gpu: StorageBuffer; cpu: Float32Array };
    normals: { gpu: StorageBuffer; cpu: Float32Array };
};

export type ChunkForgePendingOutput = {
    type: "chunkForgePendingOutput";
};

export type ChunkForgeFinalOutput = {
    type: "chunkForgeFinalOutput";
    positions: {
        gpu: StorageBuffer;
        cpu: Float32Array;
    };
    normals: {
        gpu: StorageBuffer;
        cpu: Float32Array;
    };
    indices: {
        gpu: StorageBuffer;
        cpu: Uint32Array;
    };
};

export type ChunkForgeOutput = ChunkForgeFinalOutput | ChunkForgePendingOutput;

type ProceduralHeightFieldComputePool = WorkerPool<
    ProceduralHeightFieldTask,
    SphericalProceduralHeightFieldBuilder,
    NormalTask
>;

type Custom1x1HeightFieldComputePool = WorkerPool<Custom1x1HeightFieldTask, SphericalHeightFieldBuilder1x1, NormalTask>;

type Custom2x4HeightFieldComputePool = WorkerPool<Custom2x4HeightFieldTask, SphericalHeightFieldBuilder2x4, NormalTask>;

type NormalComputePool = WorkerPool<NormalTask, SquareGridNormalComputer, ApplyTask>;

type ChunkCache = {
    positions: Map<ChunkId, { gpu: StorageBuffer; cpu: Float32Array }>;
    normals: Map<ChunkId, { gpu: StorageBuffer; cpu: Float32Array }>;
};

export class ChunkForgeCompute {
    private readonly proceduralHeightFieldComputePool: ProceduralHeightFieldComputePool;
    private readonly custom1x1HeightFieldComputePool: Custom1x1HeightFieldComputePool;
    private readonly custom2x4HeightFieldComputePool: Custom2x4HeightFieldComputePool;

    private readonly normalComputePool: NormalComputePool;

    private readonly gridIndices: {
        gpu: StorageBuffer;
        cpu: Uint32Array;
    };

    private readonly cache: ChunkCache;

    private readonly outputs: Map<ChunkId, ChunkForgeOutput> = new Map();

    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly heightMapAtlas: IPlanetHeightMapAtlas;

    readonly rowVertexCount: number;

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
        cache: ChunkCache,
        rowVertexCount: number,
        heightMapAtlas: IPlanetHeightMapAtlas,
    ) {
        this.proceduralHeightFieldComputePool = computers.heightFieldProcedural;
        this.custom1x1HeightFieldComputePool = computers.heightField1x1;
        this.custom2x4HeightFieldComputePool = computers.heightField2x4;

        this.normalComputePool = computers.normal;

        this.gridIndices = indices;

        this.heightMapAtlas = heightMapAtlas;

        this.cache = cache;

        this.rowVertexCount = rowVertexCount;
    }

    static async New(
        nbComputeShaders: number,
        rowVertexCount: number,
        heightMapAtlas: IPlanetHeightMapAtlas,
        engine: WebGPUEngine,
    ) {
        const cache: ChunkCache = {
            positions: new Map(),
            normals: new Map(),
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
                        positions: {
                            gpu: cachedValue.gpu,
                            cpu: cachedValue.cpu,
                        },
                    };
                }

                const positions = worker.dispatch(
                    task.positionOnCube,
                    task.positionOnSphere,
                    rowVertexCount,
                    task.direction,
                    task.sphereRadius,
                    task.size,
                    engine,
                );

                const positionBufferView = await positions.read();

                const positionsCpu = new Float32Array(positionBufferView.buffer);

                cache.positions.set(task.id, {
                    gpu: positions,
                    cpu: positionsCpu,
                });

                return {
                    id: task.id,
                    positions: {
                        gpu: positions,
                        cpu: positionsCpu,
                    },
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
                        positions: {
                            gpu: cachedValue.gpu,
                            cpu: cachedValue.cpu,
                        },
                    };
                }

                const positions = worker.dispatch(
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

                const positionBufferView = await positions.read();

                const positionsCpu = new Float32Array(positionBufferView.buffer);

                cache.positions.set(task.id, {
                    gpu: positions,
                    cpu: positionsCpu,
                });

                return {
                    id: task.id,
                    positions: {
                        gpu: positions,
                        cpu: positionsCpu,
                    },
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
                        positions: {
                            gpu: cachedValue.gpu,
                            cpu: cachedValue.cpu,
                        },
                    };
                }

                const positions = worker.dispatch(
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

                const positionBufferView = await positions.read();

                const positionsCpu = new Float32Array(positionBufferView.buffer);

                cache.positions.set(task.id, {
                    gpu: positions,
                    cpu: positionsCpu,
                });

                return {
                    id: task.id,
                    positions: {
                        gpu: positions,
                        cpu: positionsCpu,
                    },
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
                        normals: {
                            gpu: cachedValue.gpu,
                            cpu: cachedValue.cpu,
                        },
                        positions: task.positions,
                    };
                }

                const normals = worker.dispatch(rowVertexCount, task.positions.gpu, engine);

                const normalBufferView = await normals.read();

                const normalsCpu = new Float32Array(normalBufferView.buffer);

                cache.normals.set(task.id, {
                    gpu: normals,
                    cpu: normalsCpu,
                });

                return {
                    id: task.id,
                    normals: {
                        gpu: normals,
                        cpu: normalsCpu,
                    },
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
            cache,
            rowVertexCount,
            heightMapAtlas,
        );
    }

    public addBuildTask(
        id: string,
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

            this.runApplyTask(nextTask);
        }
    }

    public update() {
        this.updatePositions();
        this.updateNormals();
        this.applyAllReady();
    }

    public reset() {
        this.proceduralHeightFieldComputePool.reset();
        this.custom1x1HeightFieldComputePool.reset();
        this.custom2x4HeightFieldComputePool.reset();
        this.normalComputePool.reset();

        this.cache.positions.clear();
        this.cache.normals.clear();

        this.outputs.clear();

        this.applyQueue.length = 0;
    }

    public getOutput(id: ChunkId): ChunkForgeOutput | undefined {
        return this.outputs.get(id);
    }

    private runApplyTask(task: ApplyTask) {
        const { positions, normals } = task;

        this.outputs.set(task.id, {
            type: "chunkForgeFinalOutput",
            positions,
            normals,
            indices: this.gridIndices,
        });
    }
}
