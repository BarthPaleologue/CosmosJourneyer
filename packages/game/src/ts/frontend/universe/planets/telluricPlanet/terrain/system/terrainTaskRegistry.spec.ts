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

import { describe, expect, it } from "vitest";

import { makeChunkId, makeTaskId, type TerrainBuffers } from "./terrainSystem";
import { TerrainTaskRegistry } from "./terrainTaskRegistry";

function makeBuffers(value: number): TerrainBuffers {
    return {
        positions: new Float32Array([value]),
        normals: new Float32Array(),
        indices: new Uint16Array(),
        scatteredInstances: {},
    };
}

describe("TerrainTaskRegistry", () => {
    it("deduplicates concurrent builds of the same chunk", () => {
        const registry = new TerrainTaskRegistry(2);
        const chunkId = makeChunkId("chunk");

        expect(registry.registerChunkTask(chunkId, makeTaskId("first"))).toBe(true);
        expect(registry.registerChunkTask(chunkId, makeTaskId("second"))).toBe(false);
        expect(registry.getChunkOutput(chunkId)).toEqual({ status: "pending" });
    });

    it("allows a new attempt after the completed chunk is evicted", () => {
        const registry = new TerrainTaskRegistry(1);
        const firstChunkId = makeChunkId("firstChunk");
        const secondChunkId = makeChunkId("secondChunk");
        const firstTaskId = makeTaskId("firstTask");
        const secondTaskId = makeTaskId("secondTask");

        registry.registerChunkTask(firstChunkId, firstTaskId);
        registry.completeChunkTask(firstTaskId, makeBuffers(1));
        registry.registerChunkTask(secondChunkId, secondTaskId);
        registry.completeChunkTask(secondTaskId, makeBuffers(2));

        expect(registry.getChunkOutput(firstChunkId)).toBeUndefined();
        expect(registry.registerChunkTask(firstChunkId, makeTaskId("retry"))).toBe(true);
    });

    it("ignores a result from before reset", () => {
        const registry = new TerrainTaskRegistry(1);
        const chunkId = makeChunkId("chunk");
        const staleTaskId = makeTaskId("stale");

        registry.registerChunkTask(chunkId, staleTaskId);
        registry.reset();
        registry.registerChunkTask(chunkId, makeTaskId("current"));

        expect(registry.completeChunkTask(staleTaskId, makeBuffers(1))).toBe(false);
        expect(registry.getChunkOutput(chunkId)).toEqual({ status: "pending" });
    });

    it("keeps pending builds outside of the completed chunk LRU", () => {
        const registry = new TerrainTaskRegistry(1);
        const pendingChunkId = makeChunkId("pendingChunk");

        registry.registerChunkTask(pendingChunkId, makeTaskId("pendingTask"));
        for (let i = 0; i < 3; i++) {
            const chunkId = makeChunkId(`completedChunk${i}`);
            const taskId = makeTaskId(`completedTask${i}`);
            registry.registerChunkTask(chunkId, taskId);
            registry.completeChunkTask(taskId, makeBuffers(i));
        }

        expect(registry.getChunkOutput(pendingChunkId)).toEqual({ status: "pending" });
    });

    it("allows a chunk to be retried after its task fails", () => {
        const registry = new TerrainTaskRegistry(1);
        const chunkId = makeChunkId("chunk");
        const failedTaskId = makeTaskId("failed");

        registry.registerChunkTask(chunkId, failedTaskId);
        expect(registry.failTask(failedTaskId)).toBe(true);

        expect(registry.getChunkOutput(chunkId)).toBeUndefined();
        expect(registry.registerChunkTask(chunkId, makeTaskId("retry"))).toBe(true);
    });
});
