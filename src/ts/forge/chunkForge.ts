import {
    AbstractMesh,
    BoundingInfo,
    DepthRenderer,
    Matrix,
    Observable,
    TransformNode,
    Vector3,
    VertexData
} from "@babylonjs/core";
import {BuildData} from "./workerDataInterfaces";
import {ApplyTask, BuildTask, DeleteTask, ReturnedChunkData, Task, TaskType} from "./taskInterfaces";
import {WorkerPool} from "./workerPool";

export class ChunkForge {
    subdivisions: number;
    workerPool: WorkerPool;
    applyTasks: ApplyTask[] = [];

    /**
     * Contains deletion task grouped together in sublist
     */
    trashCan: DeleteTask[][] = [];

    constructor(subdivisions: number) {
        this.subdivisions = subdivisions;
        const nbMaxWorkers = navigator.hardwareConcurrency - 2; // le -2 c'est parce que faut compter le main thread et le collision worker
        this.workerPool = new WorkerPool(nbMaxWorkers);
    }

    public addTask(task: Task) {
        this.workerPool.submitTask(task);
    }

    /**
     * Executes the next task using an available worker
     * @param worker the web worker assigned to the next task
     */
    private executeNextTask(worker: Worker) {
        if (this.workerPool.taskQueue.length > 0) {
            this.dispatchTask(this.workerPool.taskQueue.shift()!, worker);
        } else {
            this.workerPool.finishedWorkers.push(worker);
        }
    }

    private executeBuildTask(task: BuildTask, worker: Worker): void {
        // delete tasks always follow build task, they are stored to be executed as callbacks of the build task
        let callbackTasks: DeleteTask[] = [];
        while (this.workerPool.taskQueue.length > 0 && this.workerPool.taskQueue[0].taskType == TaskType.Deletion) {
            callbackTasks.push(this.workerPool.taskQueue[0] as DeleteTask);
            this.workerPool.taskQueue.shift();
        }

        let buildData: BuildData = {
            taskType: TaskType.Build,
            planetID: task.planet.getName(),
            chunkLength: task.planet.rootChunkLength,
            subdivisions: this.subdivisions,
            depth: task.depth,
            direction: task.direction,
            position: [task.position.x, task.position.y, task.position.z],
            terrainSettings: task.planet.terrainSettings,
            seed: task.planet.getSeed(),
        }

        worker.postMessage(buildData);

        worker.onmessage = e => {
            let data: ReturnedChunkData = e.data;

            let vertexData = new VertexData();
            vertexData.positions = data.p;
            vertexData.normals = data.n;
            vertexData.indices = data.i;
            let grassData = data.g;

            let applyTask: ApplyTask = {
                taskType: TaskType.Apply,
                vertexData: vertexData,
                grassData: grassData,
                chunk: task.chunk,
                callbackTasks: callbackTasks,
                planet: task.planet,
                isFiner: task.isFiner
            }
            this.applyTasks.push(applyTask);
            this.workerPool.finishedWorkers.push(worker);
        };
    }

    private dispatchTask(task: DeleteTask | BuildTask, worker: Worker) {
        switch (task.taskType) {
            case TaskType.Build:
                this.executeBuildTask(task as BuildTask, worker);
                break;
            case TaskType.Deletion:
                // une tâche de suppression solitaire ne devrait pas exister
                console.error("Tâche de supression solitaire détectée");
                this.workerPool.finishedWorkers.push(worker);
                break;
            default:
                console.error("Tache illegale");
                this.workerPool.finishedWorkers.push(worker);
                break;
        }
    }

    /**
     * Removes all useless chunks
     */
    private emptyTrashCan() {
        for (const taskGroup of this.trashCan) {
            for (let i = 0; i < taskGroup.length; i++) {
                const task = taskGroup[i];
                // disabling old chunk
                task.chunk.markAsNotReady();
                // if we are removing the last old chunk, enabling new chunks
                if (i == taskGroup.length - 1) for (const chunk of task.newChunks) chunk.markAsReady();
                task.chunk.mesh.dispose();
            }
        }
        this.trashCan = [];
    }

    /**
     * Apply generated vertexData to waiting chunks
     */
    private executeNextApplyTask(depthRenderer: DepthRenderer) {
        if (this.applyTasks.length > 0) {
            let task = this.applyTasks.shift()!;
            task.vertexData.applyToMesh(task.chunk.mesh, false);
            task.chunk.mesh.freezeNormals();

            // TODO: check if equal to minDepth
            if (task.chunk.depth <= 1) task.chunk.markAsReady();

            depthRenderer.getDepthMap().renderList?.push(task.chunk.mesh);

            this.trashCan.push(task.callbackTasks);
        }
    }

    /**
     * Updates the state of the forge : dispatch tasks to workers, remove useless chunks, apply vertexData to new chunks
     */
    public update(depthRenderer: DepthRenderer) {
        for (let i = 0; i < this.workerPool.availableWorkers.length; i++) {
            let worker = this.workerPool.availableWorkers.shift()!;
            this.executeNextTask(worker);
        }
        this.workerPool.availableWorkers = this.workerPool.availableWorkers.concat(this.workerPool.finishedWorkers);
        this.workerPool.finishedWorkers = [];
        this.emptyTrashCan();

        this.executeNextApplyTask(depthRenderer);
    }
}