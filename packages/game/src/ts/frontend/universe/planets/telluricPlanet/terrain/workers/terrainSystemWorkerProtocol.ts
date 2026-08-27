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

import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { TelluricPlanetModel, TelluricSatelliteModel } from "@cosmos-journeyer/universe-model";

import type { FaceIndex } from "../chunks/faceIndex";
import type { ScatteredInstanceBuffers } from "../chunks/scatteringSystem";
import type { TaskId } from "../system/terrainSystem";

export type BuildChunkWorkerPayload = {
    type: "buildChunk";
    planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;
    position: [number, number, number];
    nbVerticesPerSide: number;
    depth: number;
    faceIndex: FaceIndex;
};

export type ComputeHeightsWorkerPayload = {
    type: "computeHeights";
    planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;
    coordinates: Float64Array;
};

export type TerrainSystemWorkerTask = {
    taskId: TaskId;
    payload: BuildChunkWorkerPayload | ComputeHeightsWorkerPayload;
};

type CreateChunkOutput = {
    type: "createChunkOutput";
    taskId: TaskId;
    positions: Float32Array<ArrayBuffer>;
    normals: Float32Array<ArrayBuffer>;
    indices: Uint16Array<ArrayBuffer>;
    scatteredInstances: ScatteredInstanceBuffers;
};

type ComputeHeightsOutput = {
    type: "computeHeightsOutput";
    taskId: TaskId;
    heights: Float32Array<ArrayBuffer>;
};

export type TerrainSystemWorkerOutput = CreateChunkOutput | ComputeHeightsOutput;
