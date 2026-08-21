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

import type { ChunkId, TaskId, TerrainBuffers, TerrainSystemChunkOutput } from "./terrainSystem";

type PendingChunkTask = { chunkId: ChunkId };

export class TerrainTaskRegistry {
    private readonly pendingTasks = new Map<TaskId, PendingChunkTask>();

    private readonly pendingChunkBuilds = new Map<ChunkId, TaskId>();

    private readonly completedChunks: LRUMap<ChunkId, TerrainBuffers>;

    public constructor(maxCachedChunks: number) {
        this.completedChunks = new LRUMap(maxCachedChunks);
    }

    public registerChunkTask(chunkId: ChunkId, taskId: TaskId): boolean {
        if (this.completedChunks.get(chunkId) !== undefined || this.pendingChunkBuilds.has(chunkId)) {
            return false;
        }

        this.pendingTasks.set(taskId, { chunkId });
        this.pendingChunkBuilds.set(chunkId, taskId);
        return true;
    }

    public completeChunkTask(taskId: TaskId, buffers: TerrainBuffers): boolean {
        const pendingTask = this.pendingTasks.get(taskId);
        if (pendingTask === undefined) {
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

    public failTask(taskId: TaskId): boolean {
        const pendingTask = this.pendingTasks.get(taskId);
        if (pendingTask === undefined) {
            return false;
        }

        this.pendingTasks.delete(taskId);
        if (this.pendingChunkBuilds.get(pendingTask.chunkId) === taskId) {
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

    public reset(): void {
        this.pendingTasks.clear();
        this.pendingChunkBuilds.clear();
        this.completedChunks.clear();
    }
}
