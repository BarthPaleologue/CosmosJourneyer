export var TaskType;
(function (TaskType) {
    TaskType[TaskType["Creation"] = 0] = "Creation";
    TaskType[TaskType["Deletion"] = 1] = "Deletion";
})(TaskType || (TaskType = {}));
export class ChunkForge {
    constructor(_baseLength, _subdivisions, _terrainFunction, _scene) {
        this.noiseLayers = [];
        this.noiseModifiers = {
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: BABYLON.Vector3.Zero(),
            minValueModifier: 1,
        };
        this.craterLayers = [];
        this.craterModifiers = {
            radiusModifier: 1,
            steepnessModifier: 1,
            maxDepthModifier: 1,
            scaleFactor: 1,
        };
        this.tasks = [];
        this.cadence = 5;
        this.maxTasksPerUpdate = 10;
        this.taskCounter = 0;
        this.esclavesDispo = [];
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        this.terrainFunction = _terrainFunction;
        for (let i = 0; i < this.cadence; i++) {
            this.esclavesDispo.push(new Worker("./components/worker.js", { type: "module" }));
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
                    //let [positions, indices, uvs] = ProceduralEngine.createSphereChunk3(this.baseLength, this.baseLength / (2 ** task.depth), this.subdivisions, task.position, task.direction, this.terrainFunction);
                    esclave === null || esclave === void 0 ? void 0 : esclave.postMessage(JSON.stringify({
                        noiseLayers: this.noiseLayers,
                        noiseModifiers: this.noiseModifiers,
                        craterLayers: this.craterLayers,
                        craterModifiers: this.craterModifiers,
                        baseLength: this.baseLength,
                        subdivisions: this.subdivisions,
                        depth: task.depth,
                        direction: task.direction,
                        offsetX: task.position.x,
                        offsetY: task.position.y,
                        offsetZ: task.position.z,
                    }));
                    esclave.onmessage = e => {
                        let vertexData = new BABYLON.VertexData();
                        vertexData.positions = e.data.positions;
                        vertexData.indices = e.data.indices;
                        vertexData.normals = e.data.normals;
                        vertexData.uvs = e.data.uvs;
                        //@ts-ignore
                        vertexData.applyToMesh(mesh);
                        mesh.parent = task.parentNode;
                        this.esclavesDispo.push(esclave);
                    };
                    break;
                case TaskType.Deletion:
                    (_a = mesh.material) === null || _a === void 0 ? void 0 : _a.dispose();
                    mesh.dispose();
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
    setTerrainFunction(f) {
        this.terrainFunction = f;
    }
}
