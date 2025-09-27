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

import { type StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { type Vector3 } from "@babylonjs/core/Maths/math.vector";

import { type ProceduralTerrainModel, type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { type HeightMap1x1, type HeightMap2x4 } from "@/frontend/assets/textures/heightMaps/utils";

import { type Direction } from "@/utils/direction";

export type ChunkId = `${string}->d${Direction}->l${number}->[x${number};y${number}]`;

export type HeightFieldTask = {
    id: ChunkId;
    positionOnCube: Vector3;
    positionOnSphere: Vector3;
    size: number;
    faceIndex: Direction;
    sphereRadius: number;
};

export type ProceduralHeightFieldTask = HeightFieldTask & {
    terrainModel: ProceduralTerrainModel;
};

type CustomHeightFieldTask = HeightFieldTask & {
    heightRange: { min: number; max: number };
};

export type Custom1x1HeightFieldTask = CustomHeightFieldTask & {
    heightMap: HeightMap1x1;
};

export type Custom2x4HeightFieldTask = CustomHeightFieldTask & {
    heightMap: HeightMap2x4;
};

export type ChunkForgePendingOutput = {
    status: "pending";
};

export type ChunkForgeCompletedOutput = {
    status: "completed";
    rowVertexCount: number;
    positions: {
        gpu: StorageBuffer;
        cpu: Float32Array;
    };
    normals: {
        gpu: StorageBuffer;
        cpu: Float32Array;
    };
    indices: {
        gpu: StorageBuffer;
        cpu: Uint32Array;
    };
};

export type ChunkForgeOutput = ChunkForgeCompletedOutput | ChunkForgePendingOutput;

export interface ChunkForge {
    /**
     * Adds a new task to the forge.
     * @param id The unique id of the chunk
     * @param positionOnCube The position of the chunk on the cube
     * @param positionOnSphere The position of the chunk on the spherized cube
     * @param faceIndex The cube side direction
     * @param size The size of the chunk in meters
     * @param sphereRadius The radius of the sphere in meters
     * @param terrainModel The model to use for the terrain generation.
     */
    pushTask(
        id: ChunkId,
        positionOnCube: Vector3,
        positionOnSphere: Vector3,
        faceIndex: Direction,
        size: number,
        sphereRadius: number,
        terrainModel: TerrainModel,
    ): void;

    /**
     * Assigns tasks to available workers and processes results.
     */
    update(): void;

    /**
     * Empties the forge, resetting all task queue and clearing caches.
     */
    reset(): void;

    /**
     * @param id The unique id of the chunk to retrieve the output for.
     * @returns The output stored in the forge for the given chunk. Will be undefined if the chunk has not been added to the forge yet.
     */
    getOutput(id: ChunkId): ChunkForgeOutput | undefined;

    readonly rowVertexCount: number;
}
