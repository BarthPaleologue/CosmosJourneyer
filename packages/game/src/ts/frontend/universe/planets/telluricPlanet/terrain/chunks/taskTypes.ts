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

import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import {
    type DeepReadonly,
    type TelluricPlanetModel,
    type TelluricSatelliteModel,
} from "@cosmos-journeyer/universe-model";
import { z } from "zod";

import { type Direction } from "./direction";
import { type PlanetChunk } from "./planetChunk";
import { ScatteredInstancesSchema, type ScatteredInstances } from "./scatteringSystem";

export type TaskType = "build" | "apply";

export type Task = {
    type: TaskType;
    chunk: PlanetChunk;
};

export type BuildTask = Task & {
    planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;
    depth: number;
    direction: Direction;
    position: Vector3;
};

export type ApplyTask = Task & {
    vertexData: VertexData;
    scatteredInstances: ScatteredInstances;
    averageHeight: number;
};

export const ReturnedChunkDataSchema = z.object({
    chunkId: z.string(),
    positions: z.instanceof(Float32Array),
    normals: z.instanceof(Float32Array),
    indices: z.instanceof(Uint16Array),
    scatteredInstances: ScatteredInstancesSchema,
    averageHeight: z.number(),
});

export type ReturnedChunkData = z.infer<typeof ReturnedChunkDataSchema>;
