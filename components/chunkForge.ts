import { Crater } from "./crater.js";
import { Direction } from "./direction.js";

export enum TaskType {
    Creation,
    DeletionSubdivision,
    DeletionDeletion
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

    // What you need to generate a beautiful terrain (à étendre pour ne pas tout hardcode dans le worker)
    craters: Crater[] = [];

    tasks: ChunkTask[] = [];
    cadence = 10;
    maxTasksPerUpdate = 15;
    taskCounter = 0;
    esclavesDispo: Worker[] = [];

    scene: BABYLON.Scene;

    constructor(_baseLength: number, _subdivisions: number, _scene: BABYLON.Scene) {
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/worker.js", { type: "module" }));
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
                    let esclave = this.esclavesDispo.shift();

                    esclave?.postMessage([
                        this.baseLength,
                        this.subdivisions,
                        task.depth,
                        task.direction,
                        [task.position.x, task.position.y, task.position.z],

                        this.craters,
                    ]);

                    esclave!.onmessage = e => {
                        let vertexData = new BABYLON.VertexData();
                        vertexData.positions = e.data.positions;
                        vertexData.indices = e.data.indices;
                        vertexData.normals = e.data.normals;
                        vertexData.uvs = e.data.uvs;
                        //@ts-ignore
                        vertexData.applyToMesh(mesh);
                        mesh!.parent = task.parentNode;
                        mesh?.setEnabled(true);
                        this.esclavesDispo.push(esclave!);
                    };
                    break;
                case TaskType.DeletionSubdivision:
                    // on vérifie que les enfants existent pour supprimer :
                    let canBeDeleted = true;
                    let prefix = task.id.slice(0, task.id.length - 1);
                    //if (!this.scene.getMeshByID(`Chunk${prefix}0]`)?.isEnabled()) canBeDeleted = false;
                    //if (!this.scene.getMeshByID(`Chunk${prefix}1]`)?.isEnabled()) canBeDeleted = false;
                    //if (!this.scene.getMeshByID(`Chunk${prefix}2]`)?.isEnabled()) canBeDeleted = false;
                    //if (!this.scene.getMeshByID(`Chunk${prefix}3]`)?.isEnabled()) canBeDeleted = false;
                    if (canBeDeleted) {
                        mesh.material?.dispose();
                        mesh.dispose();
                    } else {
                        this.tasks.push(task);
                    }
                    this.executeNextTask();
                    break;
                case TaskType.DeletionDeletion:
                    let canBeDeleted2 = true;
                    let prefix2 = task.id.slice(0, task.id.length - 2);
                    //if (!this.scene.getMeshByID(`Chunk${prefix2}]`)?.isEnabled()) canBeDeleted2 = false;
                    if (canBeDeleted2) {
                        mesh.material?.dispose();
                        mesh.dispose();
                    } else {
                        this.tasks.push(task);
                    }
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
        for (let i = 0; i < this.esclavesDispo.length; i++) {
            this.executeNextTask();
        }
    }
}