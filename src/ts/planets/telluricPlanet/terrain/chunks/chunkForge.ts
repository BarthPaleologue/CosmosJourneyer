import { BuildTask } from "./taskTypes";

export interface ChunkForge {
    addTask(task: BuildTask): void;
    update(): void;
}
