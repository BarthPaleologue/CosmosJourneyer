import {BuildTask, DeleteTask, Task} from "./taskInterfaces";

export class buildTaskQueue {
    array: ArrayBuffer
    constructor(array: ArrayBuffer) {
        this.array = array;
    }
}

export class WorkerPool {
    availableWorkers: Worker[] = []; // liste des workers disponibles pour exécuter des tâches
    finishedWorkers: Worker[] = []; // liste des workers ayant terminé leur tâche (prêts à être réintégré dans la liste des workers disponibles)
    taskQueue: (BuildTask | DeleteTask)[] = [];

    sharedMemoryBuffer: SharedArrayBuffer;
    sharedTaskQueue: buildTaskQueue;

    constructor(nbWorkers: number) {
        this.sharedMemoryBuffer = new SharedArrayBuffer(0);
        this.sharedTaskQueue = new buildTaskQueue(this.sharedMemoryBuffer);
        for (let i = 0; i < nbWorkers; ++i) {
            let worker = new Worker(new URL('../workers/workerScript.ts', import.meta.url), { type: "module" });
            this.availableWorkers.push(worker);
            worker.postMessage(this.sharedMemoryBuffer);
        }
    }

    public submitTask(task: Task) {
        this.taskQueue.push(task);
    }
}