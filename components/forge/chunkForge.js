export var TaskType;
(function (TaskType) {
    TaskType[TaskType["Creation"] = 0] = "Creation";
    TaskType[TaskType["Deletion"] = 1] = "Deletion";
})(TaskType || (TaskType = {}));
export class ChunkForge {
    constructor(_baseLength, _subdivisions, _scene) {
        // What you need to generate a beautiful terrain (à étendre pour ne pas tout hardcode dans le worker)
        this.craters = [];
        this.tasks = [];
        this.cadence = 8;
        this.maxTasksPerUpdate = 15;
        this.taskCounter = 0;
        this.esclavesDispo = [];
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/forge/builder.js", { type: "module" }));
        }
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
                    let esclave = this.esclavesDispo.shift();
                    // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                    // tâches de supressions associées : on les stock et on les execute après les créations
                    let callbackTasks = [];
                    while (this.tasks.length > 0 && this.tasks[0].taskType != TaskType.Creation) {
                        callbackTasks.push(this.tasks.shift());
                    }
                    esclave === null || esclave === void 0 ? void 0 : esclave.postMessage([
                        "buildTask",
                        this.baseLength,
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
                        vertexData.uvs = e.data.uvs;
                        vertexData.colors = e.data.colors;
                        //@ts-ignore
                        vertexData.applyToMesh(mesh);
                        this.esclavesDispo.push(esclave);
                        for (let callbackTask of callbackTasks) {
                            this.executeTask(callbackTask);
                        }
                    };
                    break;
                case TaskType.Deletion:
                    (_a = mesh.material) === null || _a === void 0 ? void 0 : _a.dispose();
                    mesh.dispose();
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
        for (let i = 0; i < this.esclavesDispo.length; i++) {
            this.executeNextTask();
        }
    }
}
