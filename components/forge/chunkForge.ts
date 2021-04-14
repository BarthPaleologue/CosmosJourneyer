import { Crater } from "./crater.js";
import { Direction } from "./direction.js";

export enum TaskType {
    Deletion,
    Build,
    Apply,
}

export interface Task {
    id: string;
}

export interface BuildTask extends Task {
    taskType: TaskType.Build,
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
    chunkLength: number;
    subdivisions: number;

    // What you need to generate a beautiful terrain (à étendre pour ne pas tout hardcode dans le worker)
    craters: Crater[] = [];

    incomingTasks: (BuildTask | ApplyTask | DeleteTask)[] = [];
    trashCan: DeleteTask[] = [];
    applyTasks: ApplyTask[] = [];
    cadence = 16;
    esclavesDispo: Worker[] = [];

    scene: BABYLON.Scene;

    constructor(_chunkLength: number, _subdivisions: number, _scene: BABYLON.Scene) {
        this.chunkLength = _chunkLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/forge/builder.js", { type: "module" }));
        }
        this.scene = _scene;
    }
    addTask(task: ApplyTask | DeleteTask | BuildTask) {
        this.incomingTasks.push(task);
    }
    executeTask(task: ApplyTask | DeleteTask | BuildTask) {
        let mesh = task.mesh;
        if (mesh != null) {
            switch (task.taskType) {
                case TaskType.Build:
                    let esclave = this.esclavesDispo.shift();

                    // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                    // tâches de supressions associées : on les stock et on les execute après les créations
                    let callbackTasks: DeleteTask[] = [];
                    while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
                        //@ts-ignore typescript pige rien à list.shift()
                        callbackTasks.push(this.incomingTasks.shift()!);
                    }

                    esclave?.postMessage([
                        "buildTask",
                        this.chunkLength,
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
                        //vertexData.uvs = e.data.uvs;
                        vertexData.colors = e.data.colors;

                        this.applyTasks.push({
                            id: task.id,
                            taskType: TaskType.Apply,
                            mesh: mesh,
                            vertexData: vertexData,
                            callbackTasks: callbackTasks,
                        });

                        this.esclavesDispo.push(esclave!);

                    };
                    break;
                case TaskType.Deletion:
                    // une tâche de suppression solitaire ne devrait pas exister
                    console.log("Tâche de supression solitaire détectée");
                    this.trashCan.push(task);
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
        if (this.incomingTasks.length > 0) {
            let nextTask = this.incomingTasks.shift();
            this.executeTask(nextTask!);
        }
    }
    emptyTrashCan(n: number) {
        for (let i = 0; i < n; i++) {
            if (this.trashCan.length > 0) {
                let task = this.trashCan.shift()!;
                task.mesh.material?.dispose();
                task.mesh.dispose();
            }
        }
    }
    executeNextApplyTask() {
        if (this.applyTasks.length > 0) {
            let task = this.applyTasks.shift()!;
            task.vertexData.applyToMesh(task.mesh);
            this.trashCan = this.trashCan.concat(task.callbackTasks);
        }
    }
    update() {
        for (let i = 0; i < this.esclavesDispo.length; i++) {
            this.executeNextTask();
        }
        this.executeNextApplyTask();
        this.emptyTrashCan(32);
    }
}