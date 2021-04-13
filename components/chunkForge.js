export var TaskType;
(function (TaskType) {
    TaskType[TaskType["Creation"] = 0] = "Creation";
    TaskType[TaskType["DeletionSubdivision"] = 1] = "DeletionSubdivision";
    TaskType[TaskType["DeletionDeletion"] = 2] = "DeletionDeletion";
})(TaskType || (TaskType = {}));
export class ChunkForge {
    constructor(_baseLength, _subdivisions, _scene) {
        // What you need to generate a beautiful terrain (à étendre pour ne pas tout hardcode dans le worker)
        this.craters = [];
        this.tasks = [];
        this.cadence = 10;
        this.maxTasksPerUpdate = 15;
        this.taskCounter = 0;
        this.esclavesDispo = [];
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/worker.js", { type: "module" }));
        }
        this.scene = _scene;
    }
    addTask(task) {
        this.tasks.push(task);
    }
    executeTask(task) {
        var _a, _b;
        let mesh = this.scene.getMeshByID(`Chunk${task.id}`);
        if (mesh != null) {
            switch (task.taskType) {
                case TaskType.Creation:
                    let esclave = this.esclavesDispo.shift();
                    esclave === null || esclave === void 0 ? void 0 : esclave.postMessage([
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
                        //@ts-ignore
                        vertexData.applyToMesh(mesh);
                        mesh.parent = task.parentNode;
                        mesh === null || mesh === void 0 ? void 0 : mesh.setEnabled(true);
                        this.esclavesDispo.push(esclave);
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
                        (_a = mesh.material) === null || _a === void 0 ? void 0 : _a.dispose();
                        mesh.dispose();
                    }
                    else {
                        this.tasks.push(task);
                    }
                    this.executeNextTask();
                    break;
                case TaskType.DeletionDeletion:
                    let canBeDeleted2 = true;
                    let prefix2 = task.id.slice(0, task.id.length - 2);
                    //if (!this.scene.getMeshByID(`Chunk${prefix2}]`)?.isEnabled()) canBeDeleted2 = false;
                    if (canBeDeleted2) {
                        (_b = mesh.material) === null || _b === void 0 ? void 0 : _b.dispose();
                        mesh.dispose();
                    }
                    else {
                        this.tasks.push(task);
                    }
                    this.executeNextTask();
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
