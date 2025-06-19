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

type HeightFieldTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    id: string;
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
    onFinish: (output: ChunkForgeOutput) => void;
    id: string;
    positions: { gpu: StorageBuffer; cpu: Float32Array };
};

type ApplyTask = {
    onFinish: (output: ChunkForgeOutput) => void;
    id: string;
    positions: { gpu: StorageBuffer; cpu: Float32Array };
    normals: { gpu: StorageBuffer; cpu: Float32Array };
};

export type ChunkForgeOutput = {
    cpu: VertexData;
    gpu: {
        positions: StorageBuffer;
        normals: StorageBuffer;
        indices: StorageBuffer;
    };
};

type ProceduralHeightFieldComputePool = WorkerPool<
    ProceduralHeightFieldTask,
    SphericalProceduralHeightFieldBuilder,
    { gpu: StorageBuffer; cpu: Float32Array; id: string; onFinish: (output: ChunkForgeOutput) => void }
>;

type Custom1x1HeightFieldComputePool = WorkerPool<
    Custom1x1HeightFieldTask,
    SphericalHeightFieldBuilder1x1,
    { gpu: StorageBuffer; cpu: Float32Array; id: string; onFinish: (output: ChunkForgeOutput) => void }
>;

type Custom2x4HeightFieldComputePool = WorkerPool<
    Custom2x4HeightFieldTask,
    SphericalHeightFieldBuilder2x4,
    { gpu: StorageBuffer; cpu: Float32Array; id: string; onFinish: (output: ChunkForgeOutput) => void }
>;

type NormalComputePool = WorkerPool<
    NormalTask,
    SquareGridNormalComputer,
    {
        normals: { gpu: StorageBuffer; cpu: Float32Array };
        positions: { gpu: StorageBuffer; cpu: Float32Array };
        id: string;
        onFinish: (output: ChunkForgeOutput) => void;
    }
>;

type ChunkCache = {
    positions: Map<string, { gpu: StorageBuffer; cpu: Float32Array }>;
    normals: Map<string, { gpu: StorageBuffer; cpu: Float32Array }>;
};

export class ChunkForgeCompute {
    private readonly proceduralHeightFieldComputePool: ProceduralHeightFieldComputePool;
    private readonly custom1x1HeightFieldComputePool: Custom1x1HeightFieldComputePool;
    private readonly custom2x4HeightFieldComputePool: Custom2x4HeightFieldComputePool;

    private readonly normalComputePool: NormalComputePool;

    private readonly gridIndicesBufferCpu: Uint32Array;
    private readonly gridIndicesBuffer: StorageBuffer;

    private readonly cache: ChunkCache;

    private readonly applyQueue: Array<ApplyTask> = [];

    private readonly engine: WebGPUEngine;

    private readonly heightMapAtlas: IPlanetHeightMapAtlas;

    readonly rowVertexCount: number;

    private constructor(
        computers: {
            heightFieldProcedural: ProceduralHeightFieldComputePool;
            heightField1x1: Custom1x1HeightFieldComputePool;
            heightField2x4: Custom2x4HeightFieldComputePool;
            normal: NormalComputePool;
        },
        gridIndicesBufferCpu: Uint32Array,
        gridIndicesBuffer: StorageBuffer,
        cache: ChunkCache,
        rowVertexCount: number,
        heightMapAtlas: IPlanetHeightMapAtlas,
        engine: WebGPUEngine,
    ) {
        this.proceduralHeightFieldComputePool = computers.heightFieldProcedural;
        this.custom1x1HeightFieldComputePool = computers.heightField1x1;
        this.custom2x4HeightFieldComputePool = computers.heightField2x4;

        this.normalComputePool = computers.normal;

        this.gridIndicesBufferCpu = gridIndicesBufferCpu;
        this.gridIndicesBuffer = gridIndicesBuffer;

        this.heightMapAtlas = heightMapAtlas;

        this.cache = cache;

        this.rowVertexCount = rowVertexCount;
        this.engine = engine;
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
                        gpu: cachedValue.gpu,
                        cpu: cachedValue.cpu,
                        onFinish: task.onFinish,
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
                    gpu: positions,
                    cpu: positionsCpu,
                    onFinish: task.onFinish,
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
                        gpu: cachedValue.gpu,
                        cpu: cachedValue.cpu,
                        onFinish: task.onFinish,
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
                    gpu: positions,
                    cpu: positionsCpu,
                    onFinish: task.onFinish,
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
                        gpu: cachedValue.gpu,
                        cpu: cachedValue.cpu,
                        onFinish: task.onFinish,
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
                    gpu: positions,
                    cpu: positionsCpu,
                    onFinish: task.onFinish,
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
                        onFinish: task.onFinish,
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
                    onFinish: task.onFinish,
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
            gridIndexBufferCpu,
            gridIndicesBuffer,
            cache,
            rowVertexCount,
            heightMapAtlas,
            engine,
        );
    }

    addBuildTask(
        onFinish: (output: ChunkForgeOutput) => void,
        id: string,
        positionOnCube: Vector3,
        positionOnSphere: Vector3,
        direction: Direction,
        size: number,
        sphereRadius: number,
        terrainModel: TerrainModel,
    ): void {
        const buildTask = {
            onFinish,
            id,
            positionOnCube,
            positionOnSphere,
            direction,
            size,
            sphereRadius,
        } satisfies HeightFieldTask;

        switch (terrainModel.type) {
            case "procedural":
                this.proceduralHeightFieldComputePool.addTask({ ...buildTask, terrainModel });
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
                this.custom1x1HeightFieldComputePool.addTask({
                    ...baseTask,
                    heightRange: terrainModel.heightRange,
                    heightMap: heightMap,
                });
                break;
            case "2x4":
                this.custom2x4HeightFieldComputePool.addTask({
                    ...baseTask,
                    heightRange: terrainModel.heightRange,
                    heightMap: heightMap,
                });
                break;
        }
    }

    updateProcedural() {
        this.proceduralHeightFieldComputePool.update();
        const proceduralHeightFieldOutputs = this.proceduralHeightFieldComputePool.consumeOutputs();
        for (const output of proceduralHeightFieldOutputs) {
            this.normalComputePool.addTask({
                onFinish: output.onFinish,
                id: output.id,
                positions: {
                    gpu: output.gpu,
                    cpu: output.cpu,
                },
            });
        }
    }

    updateCustom() {
        this.custom2x4HeightFieldComputePool.update();
        const custom2x4HeightFieldOutputs = this.custom2x4HeightFieldComputePool.consumeOutputs();
        for (const output of custom2x4HeightFieldOutputs) {
            this.normalComputePool.addTask({
                onFinish: output.onFinish,
                id: output.id,
                positions: {
                    gpu: output.gpu,
                    cpu: output.cpu,
                },
            });
        }

        this.custom1x1HeightFieldComputePool.update();
        const custom1x1HeightFieldOutputs = this.custom1x1HeightFieldComputePool.consumeOutputs();
        for (const output of custom1x1HeightFieldOutputs) {
            this.normalComputePool.addTask({
                onFinish: output.onFinish,
                id: output.id,
                positions: {
                    gpu: output.gpu,
                    cpu: output.cpu,
                },
            });
        }
    }

    updateNormals() {
        this.normalComputePool.update();
        const normalOutputs = this.normalComputePool.consumeOutputs();
        for (const output of normalOutputs) {
            this.applyQueue.push({
                onFinish: output.onFinish,
                id: output.id,
                positions: output.positions,
                normals: output.normals,
            });
        }
    }

    applyAllReady() {
        while (this.applyQueue.length > 0) {
            const nextTask = this.applyQueue.shift();
            if (nextTask === undefined) {
                break;
            }

            this.runApplyTask(nextTask);
        }
    }

    update() {
        this.updateProcedural();
        this.updateCustom();
        this.updateNormals();
        this.applyAllReady();
    }

    private runApplyTask(task: ApplyTask) {
        const { onFinish, positions, normals } = task;

        const vertexData = new VertexData();
        vertexData.positions = positions.cpu;
        vertexData.indices = this.gridIndicesBufferCpu;
        vertexData.normals = normals.cpu;

        onFinish({
            cpu: vertexData,
            gpu: {
                positions: positions.gpu,
                normals: normals.gpu,
                indices: this.gridIndicesBuffer,
            },
        });
    }
}
