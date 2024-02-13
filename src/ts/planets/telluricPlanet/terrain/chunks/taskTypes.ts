//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Direction } from "../../../../utils/direction";
import { PlanetChunk } from "./planetChunk";
import { TerrainSettings } from "../terrainSettings";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export enum TaskType {
    BUILD,
    APPLY
}

export type Task = {
    type: TaskType;
    chunk: PlanetChunk;
};

export type BuildTask = Task & {
    planetName: string;
    planetSeed: number;
    planetDiameter: number;
    terrainSettings: TerrainSettings;
    depth: number;
    direction: Direction;
    position: Vector3;
};

export type ApplyTask = Task & {
    vertexData: VertexData;
    instancesMatrixBuffer: Float32Array;
    alignedInstancesMatrixBuffer: Float32Array;
    averageHeight: number;
};

export type ReturnedChunkData = {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint16Array;
    instancesMatrixBuffer: Float32Array;
    alignedInstancesMatrixBuffer: Float32Array;
    averageHeight: number;
};
