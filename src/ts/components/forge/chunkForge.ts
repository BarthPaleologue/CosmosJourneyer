import {VertexData, DepthRenderer} from "@babylonjs/core";

import { BuilderWorker } from "../workers/builderWorker";
import { buildData } from "./workerData";
import {ApplyTask, BuildTask, DeleteTask, TaskType} from "./taskInterfaces";

export class ChunkForge {
    subdivisions: number;

    incomingTasks: (BuildTask | DeleteTask)[] = [];
    trashCan: DeleteTask[] = [];
    applyTasks: ApplyTask[] = [];

    availableWorkers: BuilderWorker[] = []; // liste des workers disponibles pour exécuter des tâches
    finishedWorkers: BuilderWorker[] = []; // liste des workers ayant terminé leur tâche (prêts à être réintégré dans la liste des workers disponibles)

    constructor(subdivisions: number) {
        this.subdivisions = subdivisions;
        const nbMaxWorkers = navigator.hardwareConcurrency - 2; // le -2 c'est parce que faut compter le main thread et le collision worker
        for (let i = 0; i < nbMaxWorkers; ++i) {
            let worker = new BuilderWorker();
            //let worker = new Worker(new URL('../workers/workerScript.ts', import.meta.url));
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
    executeNextTask(worker: BuilderWorker) {
        if (this.incomingTasks.length > 0) {
            this.DispatchTask(this.incomingTasks.shift()!, worker);
        } else {
            this.finishedWorkers.push(worker);
        }
    }

    DispatchTask(task: DeleteTask | BuildTask, worker: BuilderWorker) {

        this.incomingTasks.shift();

        switch (task.taskType) {
            case TaskType.Build:
                let castedTask = task as BuildTask;

                this.ExecuteBuildTask(worker, castedTask, task);
                break;
            case TaskType.Deletion:
                // une tâche de suppression solitaire ne devrait pas exister
                throw new Error("Tâche de supression solitaire détectée");
            default:
                throw new Error("Tache illegale");
        }
        this.finishedWorkers.push(worker);
    }

    private ExecuteBuildTask(worker: BuilderWorker, castedTask: BuildTask, task: DeleteTask | BuildTask) {
        // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
        // tâches de supressions associées : on les stock et on les execute après les créations

        let callbackTasks: DeleteTask[] = [];
        while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
            callbackTasks.push(this.incomingTasks[0]);

        }

        worker.send({
            taskType: "buildTask",
            planetID: castedTask.planet._name,
            chunkLength: castedTask.planet.rootChunkLength,
            subdivisions: this.subdivisions,
            depth: castedTask.depth,
            direction: castedTask.direction,
            position: [castedTask.position.x, castedTask.position.y, castedTask.position.z],
            craters: castedTask.planet.craters,
            terrainSettings: castedTask.planet.terrainSettings,
            seed: castedTask.planet.getSeed(),
        } as buildData);

        worker.getWorker().onmessage = e => {
            let vertexData = new VertexData();
            vertexData.positions = e.data.p as Float32Array;
            vertexData.indices = e.data.i as Uint16Array;
            vertexData.normals = e.data.n as Float32Array;

            let grassData = e.data.g as Float32Array;

            this.applyTasks.push({
                id: castedTask.id,
                taskType: TaskType.Apply,
                mesh: task.mesh,
                vertexData: vertexData,
                grassData: grassData,
                chunk: castedTask.chunk,
                callbackTasks: callbackTasks,
                planet: castedTask.planet,
            } as ApplyTask);

        };
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