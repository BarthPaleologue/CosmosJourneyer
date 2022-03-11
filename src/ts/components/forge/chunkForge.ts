import {DepthRenderer, VertexData} from "@babylonjs/core";
import {BuildData} from "./workerDataInterfaces";
import {ApplyTask, BuildTask, DeleteTask, ReturnedChunkData, Task, TaskType} from "./taskInterfaces";
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

    public addTask(task: Task) {
        this.workerPool.submitTask(task);
    }

    /**
     * Executes the next task using an available worker
     * @param worker the web worker assigned to the next task
     */
    private executeNextTask(worker: Worker) {
        if (this.workerPool.taskQueue.length > 0) {
            this.dispatchTask(this.workerPool.taskQueue.shift()!, worker);
        } else {
            this.workerPool.finishedWorkers.push(worker);
        }
    }

    private executeBuildTask(task: BuildTask, worker: Worker): void {
        // tâches de supressions associées : on les stock et on les execute après les créations
        let callbackTasks: DeleteTask[] = [];
        while (this.workerPool.taskQueue.length > 0 && this.workerPool.taskQueue[0].taskType == TaskType.Deletion) {
            callbackTasks.push(this.workerPool.taskQueue[0]);
            this.workerPool.taskQueue.shift();
        }

        let buildData: BuildData = {
            taskType: TaskType.Build,
            planetID: task.planet.getName(),
            chunkLength: task.planet.rootChunkLength,
            subdivisions: this.subdivisions,
            craters: task.planet.craters,
            depth: task.depth,
            direction: task.direction,
            position: [task.position.x,task.position.y,task.position.z],
            terrainSettings: task.planet.terrainSettings,
            seed: task.planet.getSeed(),
        }

        worker.postMessage(buildData);

        worker.onmessage = e => {
            let data: ReturnedChunkData = e.data;

            let vertexData = new VertexData();
            vertexData.positions = data.p;
            vertexData.normals = data.n;
            vertexData.indices = data.i;
            let grassData = data.g;

            let applyTask: ApplyTask = {
                id: task.id,
                taskType: TaskType.Apply,
                mesh: task.mesh,
                vertexData: vertexData,
                grassData: grassData,
                chunk: task.chunk,
                callbackTasks: callbackTasks,
                planet: task.planet
            }
            this.applyTasks.push(applyTask);
            this.workerPool.finishedWorkers.push(worker);
        };
    }

    private dispatchTask(task: DeleteTask | BuildTask, worker: Worker) {
        switch (task.taskType) {
            case TaskType.Build:
                this.executeBuildTask(task as BuildTask, worker);
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
    private emptyTrashCan(n = this.trashCan.length) {
        for (let i = 0; i < Math.min(n, this.trashCan.length); ++i) {
            this.trashCan.shift()!.mesh.dispose();
        }
    }

    /**
     * Apply generated vertexData to waiting chunks
     */
    private executeNextApplyTask(depthRenderer: DepthRenderer) {
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
    public update(depthRenderer: DepthRenderer) {
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