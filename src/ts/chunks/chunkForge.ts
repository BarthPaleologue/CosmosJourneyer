import { DepthRenderer, VertexData } from "@babylonjs/core";
import { BuildData } from "./workerDataInterfaces";
import { ApplyTask, BuildTask, DeleteTask, ReturnedChunkData, Task, TaskType } from "./taskInterfaces";
import { WorkerPool } from "./workerPool";

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
    trashCan: DeleteTask[][] = [];

    constructor(nbVerticesPerSide: number) {
        this.nbVerticesPerSide = nbVerticesPerSide;
        const nbMaxWorkers = navigator.hardwareConcurrency - 2; // le -2 c'est parce que faut compter le main thread et le collision worker
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
        while (this.workerPool.taskQueue.length > 0 && this.workerPool.taskQueue[0].type == TaskType.Deletion) {
            callbackTasks.push(this.workerPool.nextTask() as DeleteTask);
        }

        const buildData: BuildData = {
            taskType: TaskType.Build,
            planetName: task.planet.name,
            planetDiameter: task.planet.getDiameter(),
            nbVerticesPerSide: this.nbVerticesPerSide,
            depth: task.depth,
            direction: task.direction,
            position: [task.position.x, task.position.y, task.position.z],
            terrainSettings: task.planet.terrainSettings,
            seed: task.planet.seed
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
                planet: task.planet,
                isFiner: task.isFiner
            };
            this.applyTasks.push(applyTask);
            this.workerPool.finishedWorkers.push(worker);
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
    private emptyTrashCan() {
        for (const taskGroup of this.trashCan) {
            for (let i = 0; i < taskGroup.length; i++) {
                const task = taskGroup[i];
                // disabling old chunk
                task.chunk.setReady(false);
                // if we are removing the last old chunk, enabling new chunks
                if (i == taskGroup.length - 1) for (const chunk of task.newChunks) chunk.setReady(true);
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
            const task = this.applyTasks.shift()!;
            task.vertexData.applyToMesh(task.chunk.mesh, false);
            task.chunk.mesh.freezeNormals();

            if (task.chunk.depth == task.chunk.tree.minDepth) task.chunk.setReady(true);

            depthRenderer.getDepthMap().renderList?.push(task.chunk.mesh);

            this.trashCan.push(task.callbackTasks);
        }
    }

    /**
     * Updates the state of the forge : dispatch tasks to workers, remove useless chunks, apply vertexData to new chunks
     */
    public update(depthRenderer: DepthRenderer) {
        for (let i = 0; i < this.workerPool.availableWorkers.length; i++) {
            const worker = this.workerPool.availableWorkers.shift()!;
            this.executeNextTask(worker);
        }
        this.workerPool.availableWorkers = this.workerPool.availableWorkers.concat(this.workerPool.finishedWorkers);
        this.workerPool.finishedWorkers = [];
        this.emptyTrashCan();

        this.executeNextApplyTask(depthRenderer);
    }
}
