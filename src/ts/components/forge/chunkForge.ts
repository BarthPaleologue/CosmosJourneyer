import { Planet } from "../planet/planet";
import { Direction } from "../toolbox/direction";

export enum TaskType {
    Deletion,
    Build,
    Apply
}

export interface Task {
    id: string;
    taskType: TaskType;
}

export interface BuildTask extends Task {
    taskType: TaskType.Build,
    planet: Planet,
    chunkLength: number,
    depth: number,
    direction: Direction,
    position: BABYLON.Vector3,
    mesh: BABYLON.Mesh;
}

export interface ApplyTask extends Task {
    taskType: TaskType.Apply,
    mesh: BABYLON.Mesh,
    vertexData: BABYLON.VertexData,
    callbackTasks: DeleteTask[];
}

export interface DeleteTask extends Task {
    taskType: TaskType.Deletion,
    mesh: BABYLON.Mesh,
}

export class ChunkForge {
    subdivisions: number;

    incomingTasks: (BuildTask | DeleteTask)[] = [];
    trashCan: DeleteTask[] = [];
    applyTasks: ApplyTask[] = [];

    availableWorkers: Worker[] = []; // liste des workers disponibles pour exécuter des tâches
    finishedWorkers: Worker[] = []; // liste des workers ayant terminé leur tâche (prêts à être réintégré dans la liste des workers disponibles)

    constructor(subdivisions: number) {
        this.subdivisions = subdivisions;
        for (let i = 0; i < navigator.hardwareConcurrency; ++i) {
            let worker = new Worker(new URL('./builder.worker.ts', import.meta.url));
            this.availableWorkers.push(worker);
        }
    }

    addTask(task: DeleteTask | BuildTask) {
        this.incomingTasks.push(task);
    }

    /**
     * Executes the next task using an available worker
     * @param worker the web worker assigned to the next task
     */
    executeNextTask(worker: Worker) {
        if (this.incomingTasks.length > 0) {
            this.executeTask(this.incomingTasks.shift()!, worker);
        } else {
            this.finishedWorkers.push(worker);
        }
    }

    executeTask(task: DeleteTask | BuildTask, worker: Worker) {

        switch (task.taskType) {
            case TaskType.Build:

                // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                // tâches de supressions associées : on les stock et on les execute après les créations

                let callbackTasks: DeleteTask[] = [];
                while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
                    callbackTasks.push(this.incomingTasks[0]);
                    this.incomingTasks.shift();
                }

                worker.postMessage({
                    taskType: "buildTask",
                    chunkLength: task.chunkLength,
                    subdivisions: this.subdivisions,
                    depth: task.depth,
                    direction: task.direction,
                    position: [task.position.x, task.position.y, task.position.z],
                    craters: task.planet.craters,
                    noiseModifiers: task.planet.noiseModifiers,
                    craterModifiers: task.planet.craterModifiers,
                });

                worker.onmessage = e => {
                    let vertexData = new BABYLON.VertexData();
                    vertexData.positions = e.data.p as Float32Array;
                    vertexData.indices = e.data.i as Uint16Array;
                    vertexData.normals = e.data.n as Float32Array;

                    this.applyTasks.push({
                        id: task.id,
                        taskType: TaskType.Apply,
                        mesh: task.mesh,
                        vertexData: vertexData,
                        callbackTasks: callbackTasks,
                    });

                    this.finishedWorkers.push(worker);
                };
                break;
            case TaskType.Deletion:
                // une tâche de suppression solitaire ne devrait pas exister
                console.error("Tâche de supression solitaire détectée");
                this.finishedWorkers.push(worker);
                break;
            default:
                console.error("Tache illegale");
                this.finishedWorkers.push(worker);
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
    executeNextApplyTask(depthRenderer: BABYLON.DepthRenderer) {
        if (this.applyTasks.length > 0) {
            let task = this.applyTasks.shift()!;
            task.vertexData.applyToMesh(task.mesh, true);
            depthRenderer.getDepthMap().renderList!.push(task.mesh);
            this.trashCan = this.trashCan.concat(task.callbackTasks);
        }
    }

    /**
     * Updates the state of the forge : dispatch tasks to workers, remove useless chunks, apply vertexData to new chunks
     */
    update(depthRenderer: BABYLON.DepthRenderer) {
        for (let i = 0; i < this.availableWorkers.length; i++) {
            let worker = this.availableWorkers.shift()!;
            this.executeNextTask(worker);
        }

        this.availableWorkers = this.availableWorkers.concat(this.finishedWorkers);
        this.finishedWorkers = [];

        this.emptyTrashCan();
        this.executeNextApplyTask(depthRenderer);
    }
}