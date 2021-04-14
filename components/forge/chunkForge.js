export var TaskType;
(function (TaskType) {
    TaskType[TaskType["Deletion"] = 0] = "Deletion";
    TaskType[TaskType["Build"] = 1] = "Build";
    TaskType[TaskType["Apply"] = 2] = "Apply";
})(TaskType || (TaskType = {}));
export class ChunkForge {
    constructor(_chunkLength, _subdivisions, _scene) {
        // What you need to generate a beautiful terrain (à étendre pour ne pas tout hardcode dans le worker)
        this.craters = [];
        this.incomingTasks = [];
        this.trashCan = [];
        this.applyTasks = [];
        this.cadence = 16;
        this.esclavesDispo = [];
        this.chunkLength = _chunkLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/forge/builder.js", { type: "module" }));
        }
        this.scene = _scene;
    }
    addTask(task) {
        this.incomingTasks.push(task);
    }
    executeTask(task) {
        let mesh = task.mesh;
        if (mesh != null) {
            switch (task.taskType) {
                case TaskType.Build:
                    let esclave = this.esclavesDispo.shift();
                    // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                    // tâches de supressions associées : on les stock et on les execute après les créations
                    let callbackTasks = [];
                    while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
                        //@ts-ignore typescript pige rien à list.shift()
                        callbackTasks.push(this.incomingTasks.shift());
                    }
                    esclave === null || esclave === void 0 ? void 0 : esclave.postMessage([
                        "buildTask",
                        this.chunkLength,
                        this.subdivisions,
                        task.depth,
                        task.direction,
                        [task.position.x, task.position.y, task.position.z],
                        this.craters,
                    ]);
                    esclave.onmessage = e => {
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
                        this.esclavesDispo.push(esclave);
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
        else {
            console.log("le chunk n'existe pas :/");
            this.update();
        }
    }
    executeNextTask() {
        if (this.incomingTasks.length > 0) {
            let nextTask = this.incomingTasks.shift();
            this.executeTask(nextTask);
        }
    }
    emptyTrashCan(n) {
        var _a;
        for (let i = 0; i < n; i++) {
            if (this.trashCan.length > 0) {
                let task = this.trashCan.shift();
                (_a = task.mesh.material) === null || _a === void 0 ? void 0 : _a.dispose();
                task.mesh.dispose();
            }
        }
    }
    executeNextApplyTask() {
        if (this.applyTasks.length > 0) {
            let task = this.applyTasks.shift();
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
