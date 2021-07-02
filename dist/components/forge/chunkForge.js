export var TaskType;
(function (TaskType) {
    TaskType[TaskType["Deletion"] = 0] = "Deletion";
    TaskType[TaskType["Build"] = 1] = "Build";
    TaskType[TaskType["Apply"] = 2] = "Apply";
    TaskType[TaskType["Init"] = 3] = "Init";
})(TaskType || (TaskType = {}));
export class ChunkForge {
    constructor(_chunkLength, _subdivisions, _scene) {
        // What you need to generate a beautiful terrain (à étendre pour ne pas tout hardcode dans le worker)
        this.craters = [];
        this.incomingTasks = [];
        this.trashCan = [];
        this.applyTasks = [];
        this.cadence = 8;
        this.builders = [];
        this.esclavesDispo = [];
        this.chunkLength = _chunkLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            let builder = new Worker("./components/forge/builder.js", { type: "module" });
            this.builders.push(builder);
            this.esclavesDispo.push(builder);
        }
        this.scene = _scene;
    }
    setPlanet(radius, craters, noiseModifiers, craterModifiers) {
        for (let builder of this.builders) {
            builder.postMessage({
                taskType: "init",
                radius: radius,
                craters: craters,
                noiseModifiers: noiseModifiers,
                craterModifiers: craterModifiers,
            });
        }
    }
    addTask(task) {
        this.incomingTasks.push(task);
    }
    executeTask(task) {
        switch (task.taskType) {
            case TaskType.Build:
                let mesh = task.mesh;
                let esclave = this.esclavesDispo.shift();
                // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                // tâches de supressions associées : on les stock et on les execute après les créations
                let callbackTasks = [];
                while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
                    //@ts-ignore
                    callbackTasks.push(this.incomingTasks.shift());
                }
                esclave === null || esclave === void 0 ? void 0 : esclave.postMessage({
                    taskType: "buildTask",
                    chunkLength: this.chunkLength,
                    subdivisions: this.subdivisions,
                    depth: task.depth,
                    direction: task.direction,
                    position: [task.position.x, task.position.y, task.position.z],
                });
                esclave.onmessage = e => {
                    let vertexData = new BABYLON.VertexData();
                    vertexData.positions = Array.from(e.data.p);
                    vertexData.indices = Array.from(e.data.i);
                    vertexData.normals = Array.from(e.data.n);
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
    executeNextTask() {
        if (this.incomingTasks.length > 0) {
            this.executeTask(this.incomingTasks.shift());
        }
    }
    emptyTrashCan(n) {
        this.scene.disableDepthRenderer(this.scene.activeCamera);
        for (let i = 0; i < n; i++) {
            if (this.trashCan.length > 0) {
                let task = this.trashCan.shift();
                task.mesh.setEnabled(false);
                //console.log("!");
                //task.mesh.dispose(); //causes atmospheric shimmering for now
            }
        }
    }
    executeNextApplyTask() {
        if (this.applyTasks.length > 0) {
            let task = this.applyTasks.shift();
            task.vertexData.applyToMesh(task.mesh);
            setTimeout(() => {
                this.trashCan = this.trashCan.concat(task.callbackTasks);
            }, 100);
        }
    }
    update() {
        for (let esclave of this.esclavesDispo) {
            this.executeNextTask();
        }
        this.executeNextApplyTask();
        this.emptyTrashCan(10);
    }
}
