import { SolidPlanet } from "../planet/solid/planet";
import { PlanetChunk } from "../planet/solid/planetChunk";
import { Quaternion, Vector3 } from "../toolbox/algebra";
import { Direction } from "../toolbox/direction";
import { BuilderWorker } from "../workers/builderWorker";
import { buildData } from "./buildData";

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
    planet: SolidPlanet,
    depth: number,
    direction: Direction,
    position: BABYLON.Vector3,
    mesh: BABYLON.Mesh;
    chunk: PlanetChunk;
}

export interface ApplyTask extends Task {
    taskType: TaskType.Apply,
    mesh: BABYLON.Mesh,
    vertexData: BABYLON.VertexData,
    grassData: Float32Array,
    chunk: PlanetChunk;
    planet: SolidPlanet;
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
            this.executeTask(this.incomingTasks.shift()!, worker);
        } else {
            this.finishedWorkers.push(worker);
        }
    }

    executeTask(task: DeleteTask | BuildTask, worker: BuilderWorker) {

        switch (task.taskType) {
            case TaskType.Build:

                // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                // tâches de supressions associées : on les stock et on les execute après les créations

                let callbackTasks: DeleteTask[] = [];
                while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
                    callbackTasks.push(this.incomingTasks[0]);
                    this.incomingTasks.shift();
                }

                worker.send({
                    taskType: "buildTask",
                    planetID: task.planet._name,
                    chunkLength: task.planet.rootChunkLength,
                    subdivisions: this.subdivisions,
                    depth: task.depth,
                    direction: task.direction,
                    position: [task.position.x, task.position.y, task.position.z],
                    craters: task.planet.craters,
                    terrainSettings: task.planet.terrainSettings,
                    seed: task.planet._seed,
                } as buildData);

                worker.getWorker().onmessage = e => {
                    let vertexData = new BABYLON.VertexData();
                    vertexData.positions = e.data.p as Float32Array;
                    vertexData.indices = e.data.i as Uint16Array;
                    vertexData.normals = e.data.n as Float32Array;

                    let grassData = e.data.g as Float32Array;

                    this.applyTasks.push({
                        id: task.id,
                        taskType: TaskType.Apply,
                        mesh: task.mesh,
                        vertexData: vertexData,
                        grassData: grassData,
                        chunk: task.chunk,
                        callbackTasks: callbackTasks,
                        planet: task.planet,
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