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

import type { ScatteredInstanceBuffers } from "./scatteringSystem";
import { type BuildTask } from "./taskTypes";

export type ChunkId = string;

type TerrainSystemPendingOutput = {
    status: "pending";
};

export type TerrainSystemCompletedOutput = {
    status: "completed";
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint16Array;
    scatteredInstances: ScatteredInstanceBuffers;
};

export type TerrainSystemOutput = TerrainSystemPendingOutput | TerrainSystemCompletedOutput;

export interface ITerrainSystem {
    addTask(task: BuildTask): void;
    getOutput(chunkId: ChunkId): TerrainSystemOutput | undefined;
    update(): void;
    reset(): void;
}
