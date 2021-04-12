import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { Direction } from "./direction.js";

export enum TaskType {
    Creation,
    Deletion
}

export interface ChunkTask {
    taskType: TaskType,
    id: string,
    depth: number,
    direction: Direction,
    position: BABYLON.Vector3,
    parentNode: BABYLON.Mesh,
}

export class ChunkForge {
    baseLength: number;
    subdivisions: number;
    terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3;
    tasks: ChunkTask[] = [];
    cadence = 5;
    maxTasksPerUpdate = 50;
    taskCounter = 0;
    esclavesDispo: Worker[] = [];
    esclavesBusy: Worker[] = [];
    scene: BABYLON.Scene;
    constructor(_baseLength: number, _subdivisions: number, _terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3, _scene: BABYLON.Scene) {
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        this.terrainFunction = _terrainFunction;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/worker.js"));
        }
        this.scene = _scene;
    }
    addTask(task: ChunkTask) {
        this.tasks.push(task);
    }
    executeTask(task: ChunkTask) {
        let mesh = this.scene.getMeshByID(`Chunk${task.id}`);
        if (mesh != null) {
            switch (task.taskType) {
                case TaskType.Creation:
                    /*let isToBeDeleted = false;
                    for (let t of this.tasks) { // on ajoute pas le chunk si sa supression est programmée (combattre le retard du chargement sur les déplacements du joueur)
                        if (t.id == task.id && t.taskType == TaskType.Deletion) {
                            isToBeDeleted = true;
                            break;
                        }
                    }*/
                    //if (!isToBeDeleted) {
                    /*let esclave = this.esclavesDispo.shift();
                    esclave?.postMessage(JSON.stringify({
                        baseLength: this.baseLength,
                        depth: task.depth,
                        subdivisions: this.subdivisions,
                        offset: task.position,
                        direction: task.direction,
                        //@ts-ignore
                        terrainFunction: JSONfn.stringify(this.terrainFunction),
                    }));*/
                    //esclave!.onmessage = e => {
                    let vertexData = /*e.data;*/ProceduralEngine.createSphereChunk2(this.baseLength, this.baseLength / (2 ** task.depth), this.subdivisions, task.position, task.direction, this.terrainFunction);
                    //@ts-ignore
                    vertexData.applyToMesh(mesh);
                    mesh!.parent = task.parentNode;

                    //this.esclavesDispo.push(esclave!);
                    //};

                    /*} else {
                        this.executeNextTask();
                    }*/
                    break;
                case TaskType.Deletion:
                    mesh.material?.dispose();
                    mesh.dispose();
                    this.executeNextTask();
                    break;
                default:
                    console.log("Tache illegale");
                    this.executeNextTask();
            }
        } else {
            console.log("le chunk n'existe pas :/");
            this.update();
        }
    }
    executeNextTask() {
        if (this.tasks.length > 0) {
            this.taskCounter += 1;
            if (this.taskCounter < this.maxTasksPerUpdate) {
                let nextTask = this.tasks.shift();
                this.executeTask(nextTask!);
            } else this.taskCounter = 0;
        }
    }
    update() {
        for (let i = 0; i < this.cadence; i++) {
            this.executeNextTask();
        }
    }
}