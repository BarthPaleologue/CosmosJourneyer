import { BuildTask, DeleteTask } from "./taskTypes";

/*export class BuildTaskQueue {
    array: ArrayBuffer
    constructor(array: ArrayBuffer) {
        this.array = array;
    }
}*/

export class WorkerPool {
    availableWorkers: Worker[] = []; // liste des workers disponibles pour exécuter des tâches
    finishedWorkers: Worker[] = []; // liste des workers ayant terminé leur tâche (prêts à être réintégré dans la liste des workers disponibles)
    taskQueue: (BuildTask | DeleteTask)[] = [];

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

    public submitTask(task: BuildTask | DeleteTask) {
        this.taskQueue.push(task);
    }

    public hasTask(): boolean {
        return this.taskQueue.length > 0;
    }

    public nextTask(): DeleteTask | BuildTask {
        if (this.hasTask()) return this.taskQueue.shift() as DeleteTask | BuildTask;
        throw new Error("The workerpool has no task to dispatch");
    }
}
