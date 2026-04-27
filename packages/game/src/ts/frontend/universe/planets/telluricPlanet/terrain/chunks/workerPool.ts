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

import { PriorityQueue } from "@/utils/priorityQueue";

export class WorkerPool<TTask, TWorkerInput> {
    private readonly availableWorkers: Set<Worker> = new Set();
    private readonly busyWorkers: Set<Worker> = new Set();
    private readonly finishedWorkers: Set<Worker> = new Set();
    private readonly taskQueue: PriorityQueue<TTask>;

    private readonly serializeTask: (task: TTask) => TWorkerInput;
    private readonly handleWorkerResult: (event: MessageEvent<unknown>) => void;

    public constructor(
        workers: ReadonlyArray<Worker>,
        serializeTask: (task: TTask) => TWorkerInput,
        handleWorkerResult: (event: MessageEvent<unknown>) => void,
        comparator: (a: TTask, b: TTask) => boolean,
    ) {
        this.taskQueue = new PriorityQueue<TTask>(comparator);
        for (const worker of workers) {
            worker.onerror = (error) => {
                console.error("Worker error:", error);
            };
            worker.onmessageerror = (error) => {
                console.error("Worker message error:", error);
            };
            this.availableWorkers.add(worker);
        }

        this.serializeTask = serializeTask;
        this.handleWorkerResult = handleWorkerResult;
    }

    public isIdle(): boolean {
        return this.busyWorkers.size === 0 && this.taskQueue.isEmpty();
    }

    public update(): void {
        for (const worker of this.finishedWorkers) {
            this.availableWorkers.add(worker);
            this.finishedWorkers.delete(worker);
        }

        for (const worker of this.availableWorkers) {
            const nextTask = this.nextTask();
            if (nextTask === undefined) {
                break;
            }

            this.dispatchTask(worker, nextTask);
        }
    }

    private dispatchTask(worker: Worker, task: TTask): void {
        this.availableWorkers.delete(worker);
        this.busyWorkers.add(worker);

        worker.onerror = (event) => {
            console.error("Worker error", event);
            this.busyWorkers.delete(worker);
            this.finishedWorkers.add(worker);
        };

        worker.onmessageerror = (event) => {
            console.error("Worker message error", event);
            this.busyWorkers.delete(worker);
            this.finishedWorkers.add(worker);
        };

        const serializedTask = this.serializeTask(task);
        worker.postMessage(serializedTask);

        worker.onmessage = (event: MessageEvent<unknown>) => {
            this.handleWorkerResult(event);

            const nextTask = this.nextTask();

            if (nextTask !== undefined) {
                this.dispatchTask(worker, nextTask);
            } else {
                this.busyWorkers.delete(worker);
                this.finishedWorkers.add(worker);
            }
        };
    }

    public submitTask(task: TTask) {
        this.taskQueue.push(task);
    }

    public nextTask(): TTask | undefined {
        return this.taskQueue.pop();
    }

    public reset() {
        for (const worker of this.busyWorkers) {
            this.availableWorkers.add(worker);
            this.busyWorkers.delete(worker);
        }

        for (const worker of this.finishedWorkers) {
            this.availableWorkers.add(worker);
            this.finishedWorkers.delete(worker);
        }

        this.finishedWorkers.clear();
        this.busyWorkers.clear();

        for (const worker of this.availableWorkers) {
            worker.onmessage = null;
        }

        this.taskQueue.clear();
    }
}
