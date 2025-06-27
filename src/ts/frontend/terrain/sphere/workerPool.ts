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

export class WorkerPool<TTask, TWorker, TOutput> {
    private readonly tasks: Array<TTask> = [];
    private readonly workers: ReadonlyArray<TWorker>;

    private readonly dispatchWorker: (worker: TWorker, task: TTask) => Promise<TOutput>;

    private outputs: Array<TOutput> = [];

    private currentWorkLoad: Map<TWorker, Promise<void>> = new Map();

    private constructor(
        workers: ReadonlyArray<TWorker>,
        dispatchWorker: (worker: TWorker, task: TTask) => Promise<TOutput>,
    ) {
        this.workers = workers;
        this.dispatchWorker = dispatchWorker;
    }

    public static async New<TTask, TWorker, TOutput>(
        nbWorkers: number,
        makeWorker: () => Promise<TWorker>,
        dispatchWorker: (worker: TWorker, task: TTask) => Promise<TOutput>,
    ) {
        const workers: Array<TWorker> = [];

        for (let i = 0; i < nbWorkers; i++) {
            const worker = await makeWorker();
            workers.push(worker);
        }

        return new WorkerPool<TTask, TWorker, TOutput>(workers, dispatchWorker);
    }

    public push(...tasks: ReadonlyArray<TTask>) {
        this.tasks.push(...tasks);
    }

    public update() {
        for (const worker of this.workers) {
            if (this.currentWorkLoad.has(worker)) {
                continue;
            }

            const nextTask = this.tasks.shift();
            if (nextTask === undefined) {
                return;
            }

            const pendingTask = this.dispatchWorker(worker, nextTask)
                .then((output: TOutput) => {
                    this.outputs.push(output);
                })
                .catch((error: unknown) => {
                    console.error("Error while processing task with worker:", worker, error);
                })
                .finally(() => {
                    this.currentWorkLoad.delete(worker);
                });

            this.currentWorkLoad.set(worker, pendingTask);
        }
    }

    public consumeOutputs(): Array<TOutput> {
        const nbOutputs = this.outputs.length;
        const result: Array<TOutput> = [];
        for (let i = 0; i < nbOutputs; i++) {
            const output = this.outputs.shift();
            if (output === undefined) {
                break;
            }
            result.push(output);
        }

        return result;
    }

    public reset() {
        this.tasks.length = 0;
        this.outputs.length = 0;
        this.currentWorkLoad.clear();
    }
}
