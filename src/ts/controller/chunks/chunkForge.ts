import { TransferBuildData } from "./workerDataTypes";
import { ApplyTask, BuildTask, DeleteTask, ReturnedChunkData, TaskType } from "./taskTypes";
import { WorkerPool } from "./workerPool";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export class ChunkForge {
    /**
     * the number of subdivisions per chunk
     */
    nbVerticesPerSide: number;

    /**
     * The worker manager
     */
    workerPool: WorkerPool;

    /**
     * The queue of tasks containing chunks ready to be enabled
     */
    applyTasks: ApplyTask[] = [];

    /**
     * Contains deletion task grouped together in sublist
     */
    deleteTasks: DeleteTask[][] = [];

    constructor(nbVerticesPerSide: number) {
        this.nbVerticesPerSide = nbVerticesPerSide;
        const nbMaxWorkers = navigator.hardwareConcurrency - 1; // -1 because the main thread is also used
        this.workerPool = new WorkerPool(nbMaxWorkers);
    }

    public addTask(task: BuildTask | DeleteTask) {
        this.workerPool.submitTask(task);
    }

    /**
     * Executes the next task using an available worker
     * @param worker the web worker assigned to the next task
     */
    private executeNextTask(worker: Worker) {
        if (this.workerPool.hasTask()) this.dispatchTask(this.workerPool.nextTask(), worker);
        else this.workerPool.finishedWorkers.push(worker);
    }

    private executeBuildTask(task: BuildTask, worker: Worker): void {
        // delete tasks always follow build task, they are stored to be executed as callbacks of the build task
        const callbackTasks: DeleteTask[] = [];
        while (this.workerPool.taskQueue.length > 0 && this.workerPool.taskQueue[0].type === TaskType.Deletion) {
            callbackTasks.push(this.workerPool.nextTask() as DeleteTask);
        }

        const buildData: TransferBuildData = {
            taskType: TaskType.Build,
            planetName: task.planetName,
            planetDiameter: task.planetDiameter,
            nbVerticesPerSide: this.nbVerticesPerSide,
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
            vertexData.positions = data.p;
            vertexData.normals = data.n;
            vertexData.indices = data.i;

            const applyTask: ApplyTask = {
                type: TaskType.Apply,
                vertexData: vertexData,
                chunk: task.chunk,
                callbackTasks: callbackTasks,
                isFiner: task.isFiner
            };
            this.applyTasks.push(applyTask);

            if (this.workerPool.hasTask()) this.dispatchTask(this.workerPool.nextTask(), worker);
            else this.workerPool.finishedWorkers.push(worker);
        };
    }

    private dispatchTask(task: DeleteTask | BuildTask, worker: Worker) {
        switch (task.type) {
            case TaskType.Build:
                this.executeBuildTask(task as BuildTask, worker);
                break;
            case TaskType.Deletion:
                console.error("Solitary Delete Task received, this cannot happen !");
                this.workerPool.finishedWorkers.push(worker);
                break;
            default:
                console.error(`Illegal task received ! TaskType : ${task.type}`);
                this.workerPool.finishedWorkers.push(worker);
        }
    }

    /**
     * Removes all useless chunks
     */
    private executeDeleteTasks() {
        for (const deleteTask of this.deleteTasks) {
            for (let i = 0; i < deleteTask.length; i++) {
                const task = deleteTask[i];
                // disabling old chunk
                task.chunk.setReady(false);
                // if we are removing the last old chunk, enabling new chunks
                if (i === deleteTask.length - 1) for (const chunk of task.newChunks) chunk.setReady(true);
                task.chunk.dispose();
            }
        }
        this.deleteTasks = [];
    }

    /**
     * Apply generated vertexData to waiting chunks
     */
    private executeNextApplyTask() {
        const task = this.applyTasks.shift();
        if (task) {
            task.chunk.init(task.vertexData);
            this.deleteTasks.push(task.callbackTasks);
            if (task.callbackTasks.length === 0) task.chunk.setReady(true);
        }
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
        this.executeDeleteTasks();

        this.executeNextApplyTask();
    }
}
