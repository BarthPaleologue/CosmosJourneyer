import {DepthRenderer, VertexData} from "@babylonjs/core";

import {BuildData} from "./workerDataInterfaces";
import {ApplyTask, BuildTask, DeleteTask, Task, TaskType} from "./taskInterfaces";
import {WorkerPool} from "./workerPool";

export class ChunkForge {
    subdivisions: number;

    workerPool: WorkerPool;

    applyTasks: ApplyTask[] = [];

    trashCan: DeleteTask[] = [];

    constructor(subdivisions: number) {
        this.subdivisions = subdivisions;
        const nbMaxWorkers = navigator.hardwareConcurrency - 2; // le -2 c'est parce que faut compter le main thread et le collision worker

        this.workerPool = new WorkerPool(nbMaxWorkers);
    }

    addTask(task: Task) {
        this.workerPool.submitTask(task);
    }

    /**
     * Executes the next task using an available worker
     * @param worker the web worker assigned to the next task
     */
    executeNextTask(worker: Worker) {
        if (this.workerPool.taskQueue.length > 0) {
            this.executeTask(this.workerPool.taskQueue.shift()!, worker);
        } else {
            this.workerPool.finishedWorkers.push(worker);
        }
    }

    executeTask(task: DeleteTask | BuildTask, worker: Worker) {

        switch (task.taskType) {
            case TaskType.Build:
                let castedTask = task as BuildTask;

                // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                // tâches de supressions associées : on les stock et on les execute après les créations

                let callbackTasks: DeleteTask[] = [];
                while (this.workerPool.taskQueue.length > 0 && this.workerPool.taskQueue[0].taskType == TaskType.Deletion) {
                    callbackTasks.push(this.workerPool.taskQueue[0]);
                    this.workerPool.taskQueue.shift();
                }

                let buildData: BuildData = {
                    taskType: TaskType.Build,
                    planetID: castedTask.planet._name,
                    chunkLength: castedTask.planet.rootChunkLength,
                    subdivisions: this.subdivisions,
                    depth: castedTask.depth,
                    direction: castedTask.direction,
                    position: [castedTask.position.x, castedTask.position.y, castedTask.position.z],
                    craters: castedTask.planet.craters,
                    terrainSettings: castedTask.planet.terrainSettings,
                    seed: castedTask.planet.getSeed(),
                }

                worker.postMessage(buildData);

                worker.onmessage = e => {
                    let vertexData = new VertexData();
                    vertexData.positions = e.data.p as Float32Array;
                    vertexData.indices = e.data.i as Uint16Array;
                    vertexData.normals = e.data.n as Float32Array;

                    let grassData = e.data.g as Float32Array;

                    let applyTask: ApplyTask = {
                        id: castedTask.id,
                        taskType: TaskType.Apply,
                        mesh: task.mesh,
                        vertexData: vertexData,
                        grassData: grassData,
                        chunk: castedTask.chunk,
                        callbackTasks: callbackTasks,
                        planet: castedTask.planet
                    }

                    this.applyTasks.push(applyTask);

                    this.workerPool.finishedWorkers.push(worker);
                };
                break;
            case TaskType.Deletion:
                // une tâche de suppression solitaire ne devrait pas exister
                console.error("Tâche de supression solitaire détectée");
                this.workerPool.finishedWorkers.push(worker);
                break;
            default:
                console.error("Tache illegale");
                this.workerPool.finishedWorkers.push(worker);
                break;
        }
    }

    /**
     * Supprime n chunks inutiles
     * @param n nombre de chunk à supprimer
     */
    emptyTrashCan(n = this.trashCan.length) {
        for (let i = 0; i < Math.min(n, this.trashCan.length); ++i) {
            this.trashCan.shift()!.mesh.dispose();
        }
    }

    /**
     * Apply generated vertexData to waiting chunks
     */
    executeNextApplyTask(depthRenderer: DepthRenderer) {
        if (this.applyTasks.length > 0) {
            let task = this.applyTasks.shift()!;
            task.vertexData.applyToMesh(task.mesh, false);
            depthRenderer.getDepthMap().renderList!.push(task.mesh);

            /* WORKING VERSION */
            /*let planetSpacePosition = task.mesh.absolutePosition.subtract(task.planet.getAbsolutePosition());
            task.chunk.grassParticleSystem?.mesh.setAbsolutePosition(task.planet.getAbsolutePosition().add(planetSpacePosition.scale(1.1)));
            depthRenderer.getDepthMap().renderList!.push(task.chunk.grassParticleSystem!.mesh);*/

            this.trashCan = this.trashCan.concat(task.callbackTasks);
        }
    }

    /**
     * Updates the state of the forge : dispatch tasks to workers, remove useless chunks, apply vertexData to new chunks
     */
    update(depthRenderer: DepthRenderer) {
        for (let i = 0; i < this.workerPool.availableWorkers.length; i++) {
            let worker = this.workerPool.availableWorkers.shift()!;
            this.executeNextTask(worker);
        }

        this.workerPool.availableWorkers = this.workerPool.availableWorkers.concat(this.workerPool.finishedWorkers);
        this.workerPool.finishedWorkers = [];

        this.emptyTrashCan();
        this.executeNextApplyTask(depthRenderer);
    }
}