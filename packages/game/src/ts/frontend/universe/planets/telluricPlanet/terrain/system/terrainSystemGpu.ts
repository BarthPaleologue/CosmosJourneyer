//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Constants } from "@babylonjs/core/Engines/constants";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import { MaxScatterDensity } from "@/frontend/helpers/instancing";

import { Settings } from "@/settings";

import { createScatteredInstances } from "../chunks/createScatteredInstances";
import { assembleTerrainBuffers } from "./assembleTerrainBuffers";
import { makeTaskId } from "./terrainSystem";
import type {
    ChunkId,
    ITerrainSystem,
    TaskId,
    TerrainSystemChunkOutput,
    TerrainSystemHeightsOutput,
} from "./terrainSystem";
import type { BuildChunkInput, ComputeHeightsInput } from "./terrainTaskInputs";
import { TerrainTaskRegistry } from "./terrainTaskRegistry";

import buildTerrainChunkSource from "@shaders/compute/terrain/buildTerrainChunk.wgsl";
import computeTerrainHeightsSource from "@shaders/compute/terrain/computeTerrainHeights.wgsl";

type QueuedTask =
    | { readonly type: "buildChunk"; readonly id: TaskId; readonly input: BuildChunkInput }
    | { readonly type: "computeHeights"; readonly id: TaskId; readonly input: ComputeHeightsInput };

export class TerrainSystemGpu implements ITerrainSystem {
    private readonly engine: WebGPUEngine;
    private readonly rowVertexCount: number;
    private readonly chunkShader: ComputeShader;
    private readonly heightsShader: ComputeShader;

    private readonly taskRegistry = new TerrainTaskRegistry(Settings.MAX_CACHED_CHUNKS);
    private readonly queue: Array<QueuedTask> = [];
    private activeTask: Promise<void> | null = null;
    private generation = 0;

    private constructor(
        engine: WebGPUEngine,
        rowVertexCount: number,
        chunkShader: ComputeShader,
        heightsShader: ComputeShader,
    ) {
        this.engine = engine;
        this.rowVertexCount = rowVertexCount;
        this.chunkShader = chunkShader;
        this.heightsShader = heightsShader;
    }

    public static New(engine: AbstractEngine, rowVertexCount: number): Result<TerrainSystemGpu, Error> {
        try {
            if (!(engine instanceof WebGPUEngine)) {
                return err(new Error("GPU terrain requires a WebGPUEngine"));
            }
            const chunkShader = new ComputeShader(
                "terrainChunkCompute",
                engine,
                { computeSource: buildTerrainChunkSource },
                {
                    bindingsMapping: {
                        positions: { group: 0, binding: 0 },
                        normals: { group: 0, binding: 1 },
                        params: { group: 0, binding: 2 },
                    },
                },
            );
            const heightsShader = new ComputeShader(
                "terrainHeightsCompute",
                engine,
                { computeSource: computeTerrainHeightsSource },
                {
                    bindingsMapping: {
                        coordinates: { group: 0, binding: 0 },
                        heights: { group: 0, binding: 1 },
                        params: { group: 0, binding: 2 },
                    },
                },
            );
            return ok(new TerrainSystemGpu(engine, rowVertexCount, chunkShader, heightsShader));
        } catch (cause) {
            return err(cause instanceof Error ? cause : new Error("Failed to initialize GPU terrain", { cause }));
        }
    }

    public requestChunk(chunkId: ChunkId, input: BuildChunkInput): void {
        const id = makeTaskId(crypto.randomUUID());
        if (!this.taskRegistry.registerChunkTask(chunkId, id)) {
            return;
        }
        this.queue.push({ type: "buildChunk", id, input });
        this.queue.sort((left, right) => taskPriority(left) - taskPriority(right));
    }

    public getChunkOutput(chunkId: ChunkId): TerrainSystemChunkOutput | undefined {
        return this.taskRegistry.getChunkOutput(chunkId);
    }

    public requestHeights(input: ComputeHeightsInput): TaskId {
        const id = makeTaskId(crypto.randomUUID());
        this.taskRegistry.registerHeightTask(id);
        this.queue.push({ type: "computeHeights", id, input });
        return id;
    }

    public getHeightsOutput(taskId: TaskId): TerrainSystemHeightsOutput | undefined {
        return this.taskRegistry.getHeightsOutput(taskId);
    }

    public update(): void {
        if (this.activeTask !== null) {
            return;
        }
        const task = this.queue.shift();
        if (task === undefined) {
            return;
        }
        const generation = this.generation;
        const activeTask = this.runTask(task, generation).finally(() => {
            if (this.activeTask === activeTask) {
                this.activeTask = null;
            }
        });
        this.activeTask = activeTask;
    }

    public isIdle(): boolean {
        return this.queue.length === 0 && this.activeTask === null;
    }

    public reset(): void {
        this.generation++;
        this.queue.length = 0;
        this.taskRegistry.reset();
    }

    private async runTask(task: QueuedTask, generation: number): Promise<void> {
        try {
            if (task.type === "buildChunk") {
                await this.buildChunk(task, generation);
            } else {
                await this.computeHeights(task, generation);
            }
        } catch (error) {
            if (generation === this.generation) {
                this.taskRegistry.failTask(task.id);
            }
            console.error("GPU terrain task failed", error);
        }
    }

    private async buildChunk(task: Extract<QueuedTask, { type: "buildChunk" }>, generation: number): Promise<void> {
        const vertexCount = this.rowVertexCount * this.rowVertexCount;
        const byteLength = vertexCount * 4 * Float32Array.BYTES_PER_ELEMENT;
        const positions = this.createBuffer(byteLength);
        const normals = this.createBuffer(byteLength);
        const radius = task.input.planetModel.radius;
        const chunkSize = (radius * 2) / 2 ** task.input.depth;
        const settings = task.input.planetModel.terrainSettings;
        const paramsData = new Float32Array([
            this.rowVertexCount,
            chunkSize,
            task.input.faceIndex,
            radius,
            task.input.position.x,
            task.input.position.y,
            task.input.position.z,
            task.input.planetModel.seed,
            settings.continent_base_height,
            settings.continents_fragmentation,
            settings.continents_frequency,
            settings.max_mountain_height,
            settings.mountains_frequency,
            settings.max_bump_height,
            settings.bumps_frequency,
            0,
        ]);
        const params = this.createBuffer(paramsData.byteLength, paramsData);
        try {
            this.chunkShader.setStorageBuffer("positions", positions);
            this.chunkShader.setStorageBuffer("normals", normals);
            this.chunkShader.setStorageBuffer("params", params);
            await this.chunkShader.dispatchWhenReady(
                Math.ceil(this.rowVertexCount / 8),
                Math.ceil(this.rowVertexCount / 8),
                1,
            );
            const [positionView, normalView] = await Promise.all([positions.read(), normals.read()]);
            if (generation !== this.generation) {
                return;
            }
            const packedPositions = new Float32Array(positionView.buffer, positionView.byteOffset, vertexCount * 4);
            const packedNormals = new Float32Array(normalView.buffer, normalView.byteOffset, vertexCount * 4);
            const length = Math.hypot(task.input.position.x, task.input.position.y, task.input.position.z);
            const chunkSpherePosition: [number, number, number] = [
                (task.input.position.x / length) * radius,
                (task.input.position.y / length) * radius,
                (task.input.position.z / length) * radius,
            ];
            this.taskRegistry.completeChunkTask(
                task.id,
                assembleTerrainBuffers(
                    packedPositions,
                    packedNormals,
                    this.rowVertexCount,
                    chunkSize,
                    chunkSpherePosition,
                    (pointBuffer) => {
                        const pointCount = pointBuffer.length / 6;
                        const densityMultiplier =
                            pointCount === 0 ? 1 : (chunkSize ** 2 * MaxScatterDensity * 2) / pointCount;
                        return createScatteredInstances(
                            pointBuffer,
                            task.input.planetModel,
                            chunkSpherePosition,
                            densityMultiplier,
                        );
                    },
                ),
            );
        } finally {
            positions.dispose();
            normals.dispose();
            params.dispose();
        }
    }

    private async computeHeights(
        task: Extract<QueuedTask, { type: "computeHeights" }>,
        generation: number,
    ): Promise<void> {
        const pointCount = task.input.coordinates.length;
        if (pointCount === 0) {
            if (generation === this.generation) {
                this.taskRegistry.completeHeightTask(task.id, new Float32Array());
            }
            return;
        }
        const coordinatesData = new Float32Array(pointCount * 2);
        for (const [index, coordinate] of task.input.coordinates.entries()) {
            coordinatesData[index * 2] = coordinate.latitudeRadians;
            coordinatesData[index * 2 + 1] = coordinate.longitudeRadians;
        }
        const settings = task.input.planetModel.terrainSettings;
        const paramsData = new Float32Array([
            pointCount,
            task.input.planetModel.seed,
            settings.continent_base_height,
            settings.continents_fragmentation,
            settings.continents_frequency,
            settings.max_mountain_height,
            settings.mountains_frequency,
            settings.max_bump_height,
            settings.bumps_frequency,
            0,
            0,
            0,
        ]);
        const coordinates = this.createBuffer(coordinatesData.byteLength, coordinatesData);
        const heights = this.createBuffer(pointCount * Float32Array.BYTES_PER_ELEMENT);
        const params = this.createBuffer(paramsData.byteLength, paramsData);
        try {
            this.heightsShader.setStorageBuffer("coordinates", coordinates);
            this.heightsShader.setStorageBuffer("heights", heights);
            this.heightsShader.setStorageBuffer("params", params);
            await this.heightsShader.dispatchWhenReady(Math.ceil(pointCount / 64), 1, 1);
            const view = await heights.read();
            if (generation !== this.generation) {
                return;
            }
            this.taskRegistry.completeHeightTask(
                task.id,
                new Float32Array(new Float32Array(view.buffer, view.byteOffset, pointCount)),
            );
        } finally {
            coordinates.dispose();
            heights.dispose();
            params.dispose();
        }
    }

    private createBuffer(byteLength: number, data?: Float32Array): StorageBuffer {
        const buffer = new StorageBuffer(this.engine, byteLength, Constants.BUFFER_CREATIONFLAG_READWRITE);
        if (data !== undefined) {
            buffer.update(data);
        }
        return buffer;
    }
}

function taskPriority(task: QueuedTask): number {
    return task.type === "buildChunk" ? task.input.depth : Number.MAX_SAFE_INTEGER;
}
