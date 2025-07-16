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

import { Material } from "@babylonjs/core/Materials/material";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";

import { TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { Transformable } from "@/frontend/universe/architecture/transformable";

import { Direction } from "@/utils/direction";
import { FixedLengthArray } from "@/utils/types";

import { ChunkForge } from "./chunkForge";
import { ChunkIndices, SphericalHeightFieldChunk } from "./sphericalHeightFieldChunk";

export class SphericalHeightFieldTerrain implements Transformable {
    private readonly transform: TransformNode;

    private readonly sides: FixedLengthArray<SphericalHeightFieldChunk, 6>;

    constructor(id: string, sphereRadius: number, model: TerrainModel, material: Material, scene: Scene) {
        this.transform = new TransformNode(id, scene);
        this.transform.rotationQuaternion = Quaternion.Identity();

        const indices: ChunkIndices = {
            x: 0,
            y: 0,
            lod: 0,
        };

        this.sides = [
            new SphericalHeightFieldChunk(
                indices,
                Direction.UP,
                sphereRadius,
                this.getTransform(),
                model,
                material,
                scene,
            ),
            new SphericalHeightFieldChunk(
                indices,
                Direction.DOWN,
                sphereRadius,
                this.getTransform(),
                model,
                material,
                scene,
            ),
            new SphericalHeightFieldChunk(
                indices,
                Direction.FORWARD,
                sphereRadius,
                this.getTransform(),
                model,
                material,
                scene,
            ),
            new SphericalHeightFieldChunk(
                indices,
                Direction.BACKWARD,
                sphereRadius,
                this.getTransform(),
                model,
                material,
                scene,
            ),
            new SphericalHeightFieldChunk(
                indices,
                Direction.LEFT,
                sphereRadius,
                this.getTransform(),
                model,
                material,
                scene,
            ),
            new SphericalHeightFieldChunk(
                indices,
                Direction.RIGHT,
                sphereRadius,
                this.getTransform(),
                model,
                material,
                scene,
            ),
        ];
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    update(cameraPosition: Vector3, material: Material, chunkForge: ChunkForge) {
        for (const side of this.sides) {
            side.update(cameraPosition, material, chunkForge);
        }
    }

    getAllChunks(): Array<SphericalHeightFieldChunk> {
        let chunks: Array<SphericalHeightFieldChunk> = [...this.sides];
        for (const side of this.sides) {
            chunks = chunks.concat(side.getAllChildren());
        }

        return chunks;
    }

    /**
     * @returns true if all chunks are loaded and all leaf chunks are enabled, false otherwise.
     */
    isIdle() {
        const chunks = this.getAllChunks();
        const leafChunks = chunks.filter((chunk) => chunk.getAllChildren().length === 0);

        return (
            chunks.every((chunk) => chunk.getLoadingState() === "completed") &&
            leafChunks.every((chunk) => chunk.getTransform().isEnabled())
        );
    }

    dispose(): void {
        for (const side of this.sides) {
            side.dispose();
        }

        this.transform.dispose();
    }
}
