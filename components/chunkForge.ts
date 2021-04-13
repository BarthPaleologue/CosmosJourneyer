import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { Direction } from "./direction.js";
import { CraterLayer } from "./layers/craterLayer.js";
import { CraterModifiers } from "./layers/craterModifiers.js";
import { NoiseLayer } from "./layers/noiseLayer.js";
import { NoiseModifiers } from "./layers/noiseSettings.js";

export enum TaskType {
    Creation,
    Deletion
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

    // What you need to generate a beautiful terrain
    terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3;
    noiseLayers: NoiseLayer[] = [];
    noiseModifiers: NoiseModifiers = {
        strengthModifier: 1,
        amplitudeModifier: 1,
        frequencyModifier: 1,
        offsetModifier: BABYLON.Vector3.Zero(),
        minValueModifier: 1,
    };
    craterLayers: CraterLayer[] = [];
    craterModifiers: CraterModifiers = {
        radiusModifier: 1,
        steepnessModifier: 1,
        maxDepthModifier: 1,
        scaleFactor: 1,
    };

    tasks: ChunkTask[] = [];
    cadence = 5;
    maxTasksPerUpdate = 10;
    taskCounter = 0;
    esclavesDispo: Worker[] = [];

    scene: BABYLON.Scene;

    constructor(_baseLength: number, _subdivisions: number, _terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3, _scene: BABYLON.Scene) {
        this.baseLength = _baseLength;
        this.subdivisions = _subdivisions;
        this.terrainFunction = _terrainFunction;
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
                    //let [positions, indices, uvs] = ProceduralEngine.createSphereChunk3(this.baseLength, this.baseLength / (2 ** task.depth), this.subdivisions, task.position, task.direction, this.terrainFunction);

                    esclave?.postMessage(JSON.stringify({
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

                        //positions: positions,
                        //indices: indices,
                        //uvs: uvs
                    }));

                    esclave!.onmessage = e => {
                        let vertexData = new BABYLON.VertexData();
                        vertexData.positions = e.data.positions;
                        vertexData.indices = e.data.indices;
                        vertexData.normals = e.data.normals;
                        vertexData.uvs = e.data.uvs;
                        //@ts-ignore
                        vertexData.applyToMesh(mesh);
                        mesh!.parent = task.parentNode;
                        this.esclavesDispo.push(esclave!);
                    };
                    break;
                case TaskType.Deletion:
                    mesh.material?.dispose();
                    mesh.dispose();
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
    setTerrainFunction(f: (p: BABYLON.Vector3) => BABYLON.Vector3) {
        this.terrainFunction = f;
    }
}