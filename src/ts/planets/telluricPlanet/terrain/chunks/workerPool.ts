//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { BuildTask } from "./taskTypes";

/*export class BuildTaskQueue {
    array: ArrayBuffer
    constructor(array: ArrayBuffer) {
        this.array = array;
    }
}*/

export class WorkerPool {
    availableWorkers: Worker[] = []; // liste des workers disponibles pour exécuter des tâches
    finishedWorkers: Worker[] = []; // liste des workers ayant terminé leur tâche (prêts à être réintégré dans la liste des workers disponibles)
    taskQueue: BuildTask[] = [];

    //TODO: continuer à expérimenter avec le SharedArrayBuffer
    //sharedMemoryBuffer: SharedArrayBuffer;
    //sharedTaskQueue: BuildTaskQueue;

    constructor(nbWorkers: number) {
        //this.sharedMemoryBuffer = new SharedArrayBuffer(0);
        //this.sharedTaskQueue = new BuildTaskQueue(this.sharedMemoryBuffer);
        for (let i = 0; i < nbWorkers; i++) {
            const worker = new Worker(new URL("../workers/buildScript", import.meta.url), { type: "module" });
            this.availableWorkers.push(worker);
            //worker.postMessage(this.sharedMemoryBuffer);
        }
    }

    public submitTask(task: BuildTask) {
        this.taskQueue.push(task);
    }

    public hasTask(): boolean {
        return this.taskQueue.length > 0;
    }

    public nextTask(): BuildTask {
        if (this.hasTask()) return this.taskQueue.shift() as BuildTask;
        throw new Error("The workerpool has no task to dispatch");
    }
}
