//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { Brand } from "@cosmos-journeyer/typescript";

import type { ScatteredInstanceBuffers } from "../chunks/scatteringSystem";
import { type BuildChunkInput, type ComputeHeightsInput } from "./terrainTaskInputs";

export type TaskId = Brand<string, "TaskId">;

export type ChunkId = Brand<string, "ChunkId">;

export function makeTaskId(taskId: string): TaskId {
    return taskId as TaskId;
}

export function makeChunkId(chunkId: string): ChunkId {
    return chunkId as ChunkId;
}

type TerrainSystemPendingOutput = {
    status: "pending";
};

export type TerrainBuffers = {
    positions: Float32Array<ArrayBuffer>;
    normals: Float32Array<ArrayBuffer>;
    indices: Uint16Array<ArrayBuffer>;
    scatteredInstances: ScatteredInstanceBuffers;
};

export type TerrainSystemChunkComputedOutput = {
    status: "chunkComputed";
    buffers: TerrainBuffers;
};

export type TerrainSystemHeightsComputedOutput = {
    status: "heightComputed";
    heights: Float32Array<ArrayBuffer>;
};

export type TerrainSystemChunkOutput = TerrainSystemPendingOutput | TerrainSystemChunkComputedOutput;

export type TerrainSystemHeightsOutput = TerrainSystemPendingOutput | TerrainSystemHeightsComputedOutput;

export interface ITerrainSystem {
    requestChunk(chunkId: ChunkId, input: BuildChunkInput): void;
    getChunkOutput(chunkId: ChunkId): TerrainSystemChunkOutput | undefined;
    requestHeights(input: ComputeHeightsInput): TaskId;
    getHeightsOutput(taskId: TaskId): TerrainSystemHeightsOutput | undefined;
    update(): void;
    reset(): void;
}
