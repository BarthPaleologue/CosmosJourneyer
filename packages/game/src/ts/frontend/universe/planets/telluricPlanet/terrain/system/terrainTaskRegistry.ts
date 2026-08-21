//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { LRUMap } from "@/utils/dataStructures/lruMap";

import type {
    ChunkId,
    TaskId,
    TerrainBuffers,
    TerrainSystemChunkOutput,
    TerrainSystemHeightsOutput,
} from "./terrainSystem";

type PendingTask = { type: "buildChunk"; chunkId: ChunkId } | { type: "computeHeights" };

export class TerrainTaskRegistry {
    private readonly pendingTasks = new Map<TaskId, PendingTask>();

    private readonly pendingChunkBuilds = new Map<ChunkId, TaskId>();

    private readonly completedChunks: LRUMap<ChunkId, TerrainBuffers>;

    private readonly completedHeightTasks: LRUMap<TaskId, Float32Array<ArrayBuffer>>;

    public constructor(maxCachedChunks: number) {
        this.completedChunks = new LRUMap(maxCachedChunks);
        this.completedHeightTasks = new LRUMap(maxCachedChunks);
    }

    public registerChunkTask(chunkId: ChunkId, taskId: TaskId): boolean {
        if (this.completedChunks.get(chunkId) !== undefined || this.pendingChunkBuilds.has(chunkId)) {
            return false;
        }

        this.pendingTasks.set(taskId, { type: "buildChunk", chunkId });
        this.pendingChunkBuilds.set(chunkId, taskId);
        return true;
    }

    public registerHeightTask(taskId: TaskId): void {
        this.pendingTasks.set(taskId, { type: "computeHeights" });
    }

    public completeChunkTask(taskId: TaskId, buffers: TerrainBuffers): boolean {
        const pendingTask = this.pendingTasks.get(taskId);
        if (pendingTask?.type !== "buildChunk") {
            return false;
        }

        this.pendingTasks.delete(taskId);
        if (this.pendingChunkBuilds.get(pendingTask.chunkId) !== taskId) {
            return false;
        }

        this.pendingChunkBuilds.delete(pendingTask.chunkId);
        this.completedChunks.set(pendingTask.chunkId, buffers);
        return true;
    }

    public completeHeightTask(taskId: TaskId, heights: Float32Array<ArrayBuffer>): boolean {
        const pendingTask = this.pendingTasks.get(taskId);
        if (pendingTask?.type !== "computeHeights") {
            return false;
        }

        this.pendingTasks.delete(taskId);
        this.completedHeightTasks.set(taskId, heights);
        return true;
    }

    public failTask(taskId: TaskId): boolean {
        const pendingTask = this.pendingTasks.get(taskId);
        if (pendingTask === undefined) {
            return false;
        }

        this.pendingTasks.delete(taskId);
        if (pendingTask.type === "buildChunk" && this.pendingChunkBuilds.get(pendingTask.chunkId) === taskId) {
            this.pendingChunkBuilds.delete(pendingTask.chunkId);
        }
        return true;
    }

    public getChunkOutput(chunkId: ChunkId): TerrainSystemChunkOutput | undefined {
        const buffers = this.completedChunks.get(chunkId);
        if (buffers !== undefined) {
            return { status: "chunkComputed", buffers };
        }

        return this.pendingChunkBuilds.has(chunkId) ? { status: "pending" } : undefined;
    }

    public getHeightsOutput(taskId: TaskId): TerrainSystemHeightsOutput | undefined {
        const heights = this.completedHeightTasks.get(taskId);
        if (heights !== undefined) {
            return { status: "heightComputed", heights };
        }

        return this.pendingTasks.get(taskId)?.type === "computeHeights" ? { status: "pending" } : undefined;
    }

    public reset(): void {
        this.pendingTasks.clear();
        this.pendingChunkBuilds.clear();
        this.completedChunks.clear();
        this.completedHeightTasks.clear();
    }
}
