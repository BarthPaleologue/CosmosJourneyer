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
import {
    type DeepReadonly,
    type TelluricPlanetModel,
    type TelluricSatelliteModel,
} from "@cosmos-journeyer/universe-model";
import { z } from "zod";

import type { ChunkId } from "./chunkForge";
import { type FaceIndex } from "./faceIndex";
import { ScatteredInstancesSchema } from "./scatteringSystem";

export type BuildTask = {
    chunkId: ChunkId;
    planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;
    depth: number;
    faceIndex: FaceIndex;
    position: Vector3;
};

export const ReturnedChunkDataSchema = z.object({
    chunkId: z.string(),
    positions: z.instanceof(Float32Array),
    normals: z.instanceof(Float32Array),
    indices: z.instanceof(Uint16Array),
    scatteredInstances: ScatteredInstancesSchema,
});

export type ReturnedChunkData = z.infer<typeof ReturnedChunkDataSchema>;
