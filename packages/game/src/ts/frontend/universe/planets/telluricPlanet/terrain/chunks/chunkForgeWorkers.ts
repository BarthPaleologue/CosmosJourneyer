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

import { type ChunkForge } from "./chunkForge";
import { ReturnedChunkDataSchema, type ApplyTask, type BuildTask } from "./taskTypes";
import { type TransferBuildData } from "./workerDataTypes";
import { WorkerPool } from "./workerPool";

export class ChunkForgeWorkers implements ChunkForge {
    /**
     * the number vertices per row of the chunk (total number of vertices = nbVerticesPerRow * nbVerticesPerRow)
     */
    nbVerticesPerRow: number;

    /**
     * The worker manager
     * FIXME: the workerpool does not need to be a class
     */
    workerPool: WorkerPool;

    /**
     * The queue of tasks containing chunks ready to be enabled
     */
    applyTaskQueue: ApplyTask[] = [];

    constructor(nbVerticesPerRow: number) {
        this.nbVerticesPerRow = nbVerticesPerRow;
        const nbMaxWorkers = navigator.hardwareConcurrency - 1; // -1 because the main thread is also used
        this.workerPool = new WorkerPool(nbMaxWorkers, (task1, task2) => task1.depth < task2.depth);
    }

    public addTask(task: BuildTask) {
        this.workerPool.submitTask(task);
    }

    /**
     * Executes the next task using an available worker
     * @param worker the web worker assigned to the next task
     */
    private executeNextTask(worker: Worker) {
        if (this.workerPool.hasTask()) this.dispatchBuildTask(this.workerPool.nextTask(), worker);
        else this.workerPool.finishedWorkers.push(worker);
    }

    private dispatchBuildTask(task: BuildTask, worker: Worker): void {
        this.workerPool.busyWorkers.push(worker);

        const buildData: TransferBuildData = {
            taskType: "build",
            planetModel: task.planetModel,
            nbVerticesPerSide: this.nbVerticesPerRow,
            depth: task.depth,
            direction: task.direction,
            position: [task.position.x, task.position.y, task.position.z],
        };

        worker.postMessage(buildData);

        worker.onmessage = (e) => {
            const dataResult = ReturnedChunkDataSchema.safeParse(e.data);
            if (dataResult.success) {
                const data = dataResult.data;

                const vertexData = new VertexData();
                vertexData.positions = data.positions;
                vertexData.normals = data.normals;
                vertexData.indices = data.indices;

                const applyTask: ApplyTask = {
                    type: "apply",
                    vertexData: vertexData,
                    chunk: task.chunk,
                    scatteredInstances: data.scatteredInstances,
                    averageHeight: data.averageHeight,
                };
                this.applyTaskQueue.push(applyTask);
            }

            if (this.workerPool.hasTask()) this.dispatchBuildTask(this.workerPool.nextTask(), worker);
            else {
                this.workerPool.busyWorkers = this.workerPool.busyWorkers.filter((w) => w !== worker);
                this.workerPool.finishedWorkers.push(worker);
            }
        };
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
        this.workerPool.availableWorkers.push(...this.workerPool.finishedWorkers);
        this.workerPool.finishedWorkers = [];

        while (this.workerPool.availableWorkers.length > 0) {
            const worker = this.workerPool.availableWorkers.shift();
            if (worker === undefined) {
                break;
            }

            this.executeNextTask(worker);
        }

        this.executeNextApplyTask();
    }

    public reset() {
        this.applyTaskQueue.length = 0;
        this.workerPool.reset();
    }
}
