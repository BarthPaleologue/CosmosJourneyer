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

import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

import { err, ok, type Result } from "@/utils/types";

import { type ChunkForge } from "./chunkForge";
import type { PlanetChunk } from "./planetChunk";
import { ReturnedChunkDataSchema, type ApplyTask, type BuildTask } from "./taskTypes";
import { type TransferBuildData } from "./workerDataTypes";
import { WorkerPool } from "./workerPool";

export class ChunkForgeWorkers implements ChunkForge {
    /** the number vertices per row of the chunk (total number of vertices = nbVerticesPerRow * nbVerticesPerRow) */
    private readonly nbVerticesPerRow: number;

    private readonly workerPool: WorkerPool<BuildTask, TransferBuildData>;

    /** The queue of tasks containing chunks ready to be enabled */
    private readonly applyTaskQueue: Array<ApplyTask> = [];

    private readonly pendingChunks = new Map<string, PlanetChunk>();

    private constructor(workers: ReadonlyArray<Worker>, nbVerticesPerRow: number) {
        this.workerPool = new WorkerPool(
            workers,
            (task) => {
                this.pendingChunks.set(this.getChunkId(task.chunk), task.chunk);
                return this.serializeBuildTask(task);
            },
            (event) => {
                this.handleWorkerResult(event);
            },
            (task1, task2) => task1.depth < task2.depth,
        );
        this.nbVerticesPerRow = nbVerticesPerRow;
    }

    public static async New(nbVerticesPerRow: number): Promise<Result<ChunkForgeWorkers, Error>> {
        const nbMaxWorkers = Math.max(1, navigator.hardwareConcurrency - 1); // -1 because the main thread is also used

        const workerResults = await Promise.all(Array.from({ length: nbMaxWorkers }, () => this.CreateBuildWorker()));

        const errors: Array<Error> = [];
        const availableWorkers: Array<Worker> = [];
        for (const result of workerResults) {
            if (!result.success) {
                errors.push(result.error);
            } else {
                availableWorkers.push(result.value);
            }
        }

        if (errors.length > 0) {
            for (const worker of availableWorkers) {
                worker.terminate();
            }
            return err(new Error(`Failed to create workers: ${errors.map((e) => e.message).join(", ")}`));
        }

        return ok(new ChunkForgeWorkers(availableWorkers, nbVerticesPerRow));
    }

    private static async CreateBuildWorker(): Promise<Result<Worker, Error>> {
        const worker = new Worker(new URL("../workers/buildScript", import.meta.url), {
            type: "module",
        });

        return await new Promise<Result<Worker, Error>>((resolve) => {
            const handleReady = (event: MessageEvent<unknown>) => {
                if (event.data !== "ready") {
                    cleanup();
                    worker.terminate();
                    resolve(err(new Error(`Unexpected worker message before ready: ${String(event.data)}`)));
                    return;
                }

                cleanup();
                resolve(ok(worker));
            };

            const handleError = (event: ErrorEvent | MessageEvent<unknown>) => {
                cleanup();
                worker.terminate();
                resolve(err(new Error(`Worker error before ready`, { cause: event })));
            };

            const cleanup = () => {
                worker.removeEventListener("message", handleReady);
                worker.removeEventListener("error", handleError);
                worker.removeEventListener("messageerror", handleError);
            };

            worker.addEventListener("message", handleReady);
            worker.addEventListener("error", handleError);
            worker.addEventListener("messageerror", handleError);
        });
    }

    public addTask(task: BuildTask) {
        this.workerPool.submitTask(task);
    }

    private getChunkId(chunk: PlanetChunk): string {
        return chunk.getTransform().name;
    }

    private serializeBuildTask(task: BuildTask): TransferBuildData {
        return {
            taskType: "build",
            chunkId: this.getChunkId(task.chunk),
            planetModel: task.planetModel,
            nbVerticesPerSide: this.nbVerticesPerRow,
            depth: task.depth,
            direction: task.direction,
            position: [task.position.x, task.position.y, task.position.z],
        };
    }

    private handleWorkerResult(e: MessageEvent) {
        const dataResult = ReturnedChunkDataSchema.safeParse(e.data);
        if (!dataResult.success) {
            return;
        }

        const data = dataResult.data;

        const vertexData = new VertexData();
        vertexData.positions = data.positions;
        vertexData.normals = data.normals;
        vertexData.indices = data.indices;

        const chunk = this.pendingChunks.get(data.chunkId);
        if (chunk === undefined) {
            return;
        }

        this.pendingChunks.delete(data.chunkId);

        const applyTask: ApplyTask = {
            type: "apply",
            vertexData,
            chunk,
            scatteredInstances: data.scatteredInstances,
            averageHeight: data.averageHeight,
        };
        this.applyTaskQueue.push(applyTask);
    }

    /**
     * Apply generated vertexData to waiting chunks
     */
    private executeNextApplyTask() {
        let task = this.applyTaskQueue.shift();
        while (task !== undefined && task.chunk.hasBeenDisposed()) {
            // if the chunk has been disposed, we skip it
            task = this.applyTaskQueue.shift();
        }

        if (task !== undefined) {
            task.chunk.init(task.vertexData, task.scatteredInstances, task.averageHeight);
        }
    }

    /**
     * Updates the state of the forge : dispatch tasks to workers, remove useless chunks, apply vertexData to new chunks
     */
    public update() {
        this.workerPool.update();
        this.executeNextApplyTask();
    }

    public isIdle() {
        return this.applyTaskQueue.length === 0 && this.workerPool.isIdle();
    }

    public reset() {
        this.applyTaskQueue.length = 0;
        this.workerPool.reset();
    }
}
