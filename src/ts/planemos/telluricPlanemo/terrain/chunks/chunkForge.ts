import { TransferBuildData } from "./workerDataTypes";
import { ApplyTask, BuildTask, ReturnedChunkData, TaskType } from "./taskTypes";
import { WorkerPool } from "./workerPool";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export class ChunkForge {
    /**
     * the number vertices per row of the chunk (total number of vertices = nbVerticesPerRow * nbVerticesPerRow)
     */
    nbVerticesPerRow: number;

    /**
     * The worker manager
     * FIXME: the workerpool does not need to be a class
     */
    workerPool: WorkerPool;

    /**
     * The queue of tasks containing chunks ready to be enabled
     */
    applyTaskQueue: ApplyTask[] = [];

    constructor(nbVerticesPerRow: number) {
        this.nbVerticesPerRow = nbVerticesPerRow;
        const nbMaxWorkers = navigator.hardwareConcurrency - 1; // -1 because the main thread is also used
        this.workerPool = new WorkerPool(nbMaxWorkers);
    }

    public addTask(task: BuildTask) {
        this.workerPool.submitTask(task);
    }

    /**
     * Executes the next task using an available worker
     * @param worker the web worker assigned to the next task
     */
    private executeNextTask(worker: Worker) {
        if (this.workerPool.hasTask()) this.dispatchBuildTask(this.workerPool.nextTask(), worker);
        else this.workerPool.finishedWorkers.push(worker);
    }

    private dispatchBuildTask(task: BuildTask, worker: Worker): void {
        const buildData: TransferBuildData = {
            taskType: TaskType.Build,
            planetName: task.planetName,
            planetDiameter: task.planetDiameter,
            nbVerticesPerSide: this.nbVerticesPerRow,
            depth: task.depth,
            direction: task.direction,
            position: [task.position.x, task.position.y, task.position.z],
            terrainSettings: {
                continents_frequency: task.terrainSettings.continents_frequency,
                continents_fragmentation: task.terrainSettings.continents_fragmentation,
                continent_base_height: task.terrainSettings.continent_base_height,
                max_mountain_height: task.terrainSettings.max_mountain_height,
                max_bump_height: task.terrainSettings.max_bump_height,
                bumps_frequency: task.terrainSettings.bumps_frequency,
                mountains_frequency: task.terrainSettings.mountains_frequency
            },
            seed: task.planetSeed
        };

        worker.postMessage(buildData);

        worker.onmessage = (e) => {
            const data: ReturnedChunkData = e.data;

            const vertexData = new VertexData();
            vertexData.positions = data.positions;
            vertexData.normals = data.normals;
            vertexData.indices = data.indices;

            const applyTask: ApplyTask = {
                type: TaskType.Apply,
                vertexData: vertexData,
                chunk: task.chunk,
                instancesMatrixBuffer: data.instancesMatrixBuffer,
                alignedInstancesMatrixBuffer: data.alignedInstancesMatrixBuffer,
                averageHeight: data.averageHeight
            };
            this.applyTaskQueue.push(applyTask);

            if (this.workerPool.hasTask()) this.dispatchBuildTask(this.workerPool.nextTask(), worker);
            else this.workerPool.finishedWorkers.push(worker);
        };
    }

    /**
     * Apply generated vertexData to waiting chunks
     */
    private executeNextApplyTask() {
        let task = this.applyTaskQueue.shift();
        while (task !== undefined && task.chunk.hasBeenDisposed()) {
            // if the chunk has been disposed, we skip it
            task = this.applyTaskQueue.shift();
        }
        if (task) task.chunk.init(task.vertexData, task.instancesMatrixBuffer, task.alignedInstancesMatrixBuffer, task.averageHeight);
    }

    /**
     * Updates the state of the forge : dispatch tasks to workers, remove useless chunks, apply vertexData to new chunks
     */
    public update() {
        for (let i = 0; i < this.workerPool.availableWorkers.length; i++) {
            this.executeNextTask(this.workerPool.availableWorkers.shift() as Worker);
        }
        this.workerPool.availableWorkers = this.workerPool.availableWorkers.concat(this.workerPool.finishedWorkers);
        this.workerPool.finishedWorkers = [];

        this.executeNextApplyTask();
    }
}