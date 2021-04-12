import { ProceduralEngine } from "../engine/proceduralEngine.js";
export var TaskType;
(function (TaskType) {
    TaskType[TaskType["Creation"] = 0] = "Creation";
    TaskType[TaskType["Deletion"] = 1] = "Deletion";
})(TaskType || (TaskType = {}));
export class ChunkForge {
    constructor(_baseLength, _subdivisions, _terrainFunction, _scene) {
        this.cadence = 5;
        this.maxTasksPerUpdate = 20;
        this.taskCounter = 0;
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        this.terrainFunction = _terrainFunction;
        this.tasks = [];
        this.scene = _scene;
    }
    addTask(task) {
        this.tasks.push(task);
    }
    executeTask(task) {
        var _a;
        let mesh = this.scene.getMeshByID(`Chunk${task.id}`);
        if (mesh != null) {
            switch (task.taskType) {
                case TaskType.Creation:
                    let vertexData = ProceduralEngine.createSphereChunk2(this.baseLength, this.baseLength / (Math.pow(2, task.depth)), this.subdivisions, BABYLON.Vector3.Zero(), task.position, task.direction, this.scene, this.terrainFunction);
                    //@ts-ignore
                    vertexData.applyToMesh(mesh);
                    mesh.parent = task.parentNode;
                    break;
                case TaskType.Deletion:
                    (_a = mesh.material) === null || _a === void 0 ? void 0 : _a.dispose();
                    mesh.dispose();
                    this.executeNextTask();
                    break;
                default:
                    console.log("Tache illegale");
                //this.executeNextTask();
            }
        }
        else {
            console.log("le chunk n'existe pas :/");
            this.update();
        }
    }
    executeNextTask() {
        if (this.tasks.length > 0) {
            this.taskCounter += 1;
            if (this.taskCounter < this.maxTasksPerUpdate) {
                let nextTask = this.tasks.shift();
                this.executeTask(nextTask);
            }
            else
                this.taskCounter = 0;
        }
    }
    update() {
        for (let i = 0; i < this.cadence; i++) {
            this.executeNextTask();
        }
    }
}
