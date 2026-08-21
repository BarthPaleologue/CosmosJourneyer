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

import { err, ok, type Result } from "@cosmos-journeyer/typescript";

import { Settings } from "@/settings";

import {
    type BuildChunkWorkerPayload,
    type TerrainSystemWorkerOutput,
    type TerrainSystemWorkerTask,
} from "../workers/terrainSystemWorkerProtocol";
import {
    type ChunkId,
    type ITerrainSystem,
    type TaskId,
    type TerrainSystemChunkOutput,
    makeTaskId,
} from "./terrainSystem";
import { type BuildChunkInput } from "./terrainTaskInputs";
import { TerrainTaskRegistry } from "./terrainTaskRegistry";
import { WorkerPool } from "./workerPool";

type QueuedTask = { type: "buildChunk"; id: TaskId; input: BuildChunkInput };

export class TerrainSystemCpu implements ITerrainSystem {
    /** the number vertices per row of the chunk (total number of vertices = nbVerticesPerRow * nbVerticesPerRow) */
    private readonly nbVerticesPerRow: number;

    private readonly workerPool: WorkerPool<QueuedTask, TerrainSystemWorkerTask, TerrainSystemWorkerOutput>;

    private readonly taskRegistry = new TerrainTaskRegistry(Settings.MAX_CACHED_CHUNKS);

    private constructor(workers: ReadonlyArray<Worker>, nbVerticesPerRow: number) {
        this.workerPool = new WorkerPool(
            workers,
            ({ id, input }) => ({
                taskId: id,
                payload: this.serializeBuildChunkInput(input),
            }),
            (event) => {
                this.handleWorkerResult(event);
            },
            ({ id }) => {
                this.taskRegistry.failTask(id);
            },
            (a, b) => a.input.depth < b.input.depth,
        );
        this.nbVerticesPerRow = nbVerticesPerRow;
    }

    public static async New(nbVerticesPerRow: number): Promise<Result<TerrainSystemCpu, Error>> {
        const nbMaxWorkers = Math.max(1, navigator.hardwareConcurrency - 1); // -1 because the main thread is also used

        const workerResults = await Promise.all(
            Array.from({ length: nbMaxWorkers }, async () => this.CreateBuildWorker()),
        );

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

        return ok(new TerrainSystemCpu(availableWorkers, nbVerticesPerRow));
    }

    private static async CreateBuildWorker(): Promise<Result<Worker, Error>> {
        const worker = new Worker(new URL("../workers/terrainSystemWorker", import.meta.url), {
            type: "module",
        });

        return await new Promise<Result<Worker, Error>>((resolve) => {
            const handleReady = (event: MessageEvent<unknown>): void => {
                if (event.data !== "ready") {
                    cleanup();
                    worker.terminate();
                    resolve(err(new Error(`Unexpected worker message before ready: ${String(event.data)}`)));
                    return;
                }

                cleanup();
                resolve(ok(worker));
            };

            const handleError = (event: ErrorEvent | MessageEvent<unknown>): void => {
                cleanup();
                worker.terminate();
                resolve(err(new Error(`Worker error before ready`, { cause: event })));
            };

            const cleanup = (): void => {
                worker.removeEventListener("message", handleReady);
                worker.removeEventListener("error", handleError);
                worker.removeEventListener("messageerror", handleError);
            };

            worker.addEventListener("message", handleReady);
            worker.addEventListener("error", handleError);
            worker.addEventListener("messageerror", handleError);
        });
    }

    public requestChunk(chunkId: ChunkId, input: BuildChunkInput): void {
        const id = makeTaskId(crypto.randomUUID());
        if (!this.taskRegistry.registerChunkTask(chunkId, id)) {
            return;
        }

        this.workerPool.submitTask({ type: "buildChunk", id, input });
    }

    public getChunkOutput(chunkId: ChunkId): TerrainSystemChunkOutput | undefined {
        return this.taskRegistry.getChunkOutput(chunkId);
    }

    private serializeBuildChunkInput(input: BuildChunkInput): BuildChunkWorkerPayload {
        return {
            type: "buildChunk",
            planetModel: input.planetModel,
            nbVerticesPerSide: this.nbVerticesPerRow,
            depth: input.depth,
            faceIndex: input.faceIndex,
            position: [input.position.x, input.position.y, input.position.z],
        };
    }

    private handleWorkerResult({ data }: MessageEvent<TerrainSystemWorkerOutput>): void {
        const taskId = makeTaskId(data.taskId);

        this.taskRegistry.completeChunkTask(taskId, data);
    }

    /**
     * Updates the state of the system: dispatch tasks to workers, remove useless chunks, apply vertexData to new chunks
     */
    public update(): void {
        this.workerPool.update();
    }

    public isIdle(): boolean {
        return this.workerPool.isIdle();
    }

    public reset(): void {
        this.workerPool.reset();
        this.taskRegistry.reset();
    }
}
