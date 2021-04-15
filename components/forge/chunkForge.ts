import { ColorSettings } from "../planet.js";
import { Crater } from "./crater.js";
import { Direction } from "./direction.js";
import { CraterModifiers } from "./layers/craterModifiers.js";
import { NoiseModifiers } from "./layers/noiseSettings.js";

export enum TaskType {
    Deletion,
    Build,
    Apply,
    Init,
}

export interface Task {
    id: string;
}

export interface InitTask extends Task {
    taskType: TaskType.Init,
    craters: Crater[],
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

    incomingTasks: (BuildTask | ApplyTask | DeleteTask | InitTask)[] = [];
    trashCan: DeleteTask[] = [];
    applyTasks: ApplyTask[] = [];
    cadence = 16;

    builders: Worker[] = [];
    esclavesDispo: Worker[] = [];

    scene: BABYLON.Scene;

    constructor(_chunkLength: number, _subdivisions: number, _scene: BABYLON.Scene) {
        this.chunkLength = _chunkLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            let builder = new Worker("./components/forge/builder.js", { type: "module" });
            this.builders.push(builder);
            this.esclavesDispo.push(builder);
        }
        this.scene = _scene;
    }
    setPlanet(radius: number, craters: Crater[], noiseModifiers: NoiseModifiers, craterModifiers: CraterModifiers, colorSettings: ColorSettings) {
        for (let builder of this.builders) {
            builder.postMessage({
                taskType: "init",
                radius: radius,
                craters: craters,
                noiseModifiers: noiseModifiers,
                craterModifiers: craterModifiers,
                colorSettings: colorSettings,
            });
        }
    }
    addTask(task: ApplyTask | DeleteTask | BuildTask | InitTask) {
        this.incomingTasks.push(task);
    }
    executeTask(task: ApplyTask | DeleteTask | BuildTask | InitTask) {
        switch (task.taskType) {
            case TaskType.Build:
                let mesh = task.mesh;
                let esclave = this.esclavesDispo.shift();

                // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                // tâches de supressions associées : on les stock et on les execute après les créations
                let callbackTasks: DeleteTask[] = [];
                while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
                    //@ts-ignore typescript pige rien à list.shift()
                    callbackTasks.push(this.incomingTasks.shift()!);
                }

                esclave?.postMessage({
                    taskType: "buildTask",
                    chunkLength: this.chunkLength,
                    subdivisions: this.subdivisions,
                    depth: task.depth,
                    direction: task.direction,
                    position: [task.position.x, task.position.y, task.position.z],

                    //this.craters,
                });

                esclave!.onmessage = e => {
                    let vertexData = new BABYLON.VertexData();
                    vertexData.positions = Array.from(e.data.p);
                    vertexData.indices = Array.from(e.data.i);
                    vertexData.normals = Array.from(e.data.n);
                    vertexData.colors = Array.from(e.data.c);

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
        for (let esclave of this.esclavesDispo) {
            this.executeNextTask();
        }
        this.executeNextApplyTask();
        this.emptyTrashCan(32);
    }
}