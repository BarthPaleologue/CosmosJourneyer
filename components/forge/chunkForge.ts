import { Crater } from "./crater.js";
import { Direction } from "./direction.js";

export enum TaskType {
    Creation,
    Deletion,
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
    cadence = 8;
    maxTasksPerUpdate = 15;
    taskCounter = 0;
    esclavesDispo: Worker[] = [];

    scene: BABYLON.Scene;

    constructor(_baseLength: number, _subdivisions: number, _scene: BABYLON.Scene) {
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/forge/builder.js", { type: "module" }));
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

                    // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                    // tâches de supressions associées : on les stock et on les execute après les créations
                    let callbackTasks: ChunkTask[] = [];
                    while (this.tasks.length > 0 && this.tasks[0].taskType != TaskType.Creation) {
                        callbackTasks.push(this.tasks.shift()!);
                    }

                    esclave?.postMessage([
                        "buildTask",
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
                        vertexData.colors = e.data.colors;
                        //@ts-ignore
                        vertexData.applyToMesh(mesh);

                        this.esclavesDispo.push(esclave!);

                        for (let callbackTask of callbackTasks) {
                            this.executeTask(callbackTask);
                        }
                    };
                    break;
                case TaskType.Deletion:
                    mesh.material?.dispose();
                    mesh.dispose();
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