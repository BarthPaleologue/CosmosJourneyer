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

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { type Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getQuaternionFromDirection, type Direction } from "@/utils/direction";
import { clamp } from "@/utils/math";
import { type FixedLengthArray } from "@/utils/types";

import { Settings } from "@/settings";

import { type ChunkForge, type ChunkForgeFinalOutput, type ChunkId } from "./chunkForge";

type ChunkLoadingState = "not_started" | "in_progress" | "completed";

export type ChunkIndices = {
    x: number;
    y: number;
    lod: number;
};

/**
 * Represents a chunk of a spherical height field terrain using a cube-sphere approach.
 * The cube is easily subdivided into smaller chunks that can be projected on a sphere for a planet-like terrain.
 * Each chunk corresponds to a square section of the terrain at a specific level of detail (LOD).
 * The chunk is positioned on a sphere and can be subdivided into smaller chunks.
 * Chunks rely on a ChunkForge to compute their vertex data asynchronously.
 */
export class SphericalHeightFieldChunk implements Transformable {
    private readonly id: ChunkId;
    private readonly indices: ChunkIndices;

    private readonly mesh: Mesh;

    private readonly direction: Direction;

    /**
     * The radius of the underlying planet sphere in meters
     */
    private readonly sphereRadius: number;

    /**
     * The size of one side of the chunk in meters.
     */
    private readonly sideLength: number;

    private loadingState: ChunkLoadingState = "not_started";

    private children: FixedLengthArray<SphericalHeightFieldChunk, 4> | null = null;

    private readonly parent: TransformNode;

    /**
     * The position of the chunk on the cube before normalization to the sphere shape
     */
    private readonly positionOnCube: Vector3;

    private vertexData: ChunkForgeFinalOutput | null = null;

    private readonly terrainModel: TerrainModel;

    constructor(
        indices: ChunkIndices,
        direction: Direction,
        sphereRadius: number,
        parent: TransformNode,
        terrainModel: TerrainModel,
        material: Material,
        scene: Scene,
    ) {
        this.id = `${parent.name}->d${direction}->l${indices.lod}->[x${indices.x};y${indices.y}]`;

        this.mesh = new Mesh(this.id, scene);
        this.mesh.isPickable = false;
        this.mesh.parent = parent;
        this.mesh.material = material;

        this.parent = parent;

        this.indices = { ...indices };

        this.terrainModel = terrainModel;

        this.mesh.position.x = -sphereRadius + (sphereRadius * 2 * (indices.x + 0.5)) / 2 ** indices.lod;
        this.mesh.position.y = -sphereRadius + (sphereRadius * 2 * (indices.y + 0.5)) / 2 ** indices.lod;
        this.mesh.position.z = sphereRadius;

        this.mesh.position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.positionOnCube = this.mesh.position.clone();

        this.mesh.position.normalize().scaleInPlace(sphereRadius);

        this.direction = direction;
        this.sphereRadius = sphereRadius;

        this.sideLength = (sphereRadius * 2) / 2 ** indices.lod;

        this.mesh.setEnabled(false);
    }

    private setVertexData(vertexData: ChunkForgeFinalOutput, rowVertexCount: number, engine: AbstractEngine) {
        // see https://forum.babylonjs.com/t/how-to-share-webgpu-index-buffer-between-meshes/58902/2
        // the reference counter is automatically decremented when calling dispose on the mesh
        vertexData.positions.gpu.getBuffer().references++;
        vertexData.normals.gpu.getBuffer().references++;
        vertexData.indices.gpu.getBuffer().references++;

        const positionsVertexBuffer = new VertexBuffer(
            engine,
            vertexData.positions.gpu.getBuffer(),
            "position",
            false,
            false,
            3,
        );

        this.mesh.setVerticesBuffer(positionsVertexBuffer);

        const normalsVertexBuffer = new VertexBuffer(
            engine,
            vertexData.normals.gpu.getBuffer(),
            "normal",
            false,
            false,
            3,
        );
        this.mesh.setVerticesBuffer(normalsVertexBuffer);

        this.mesh.setIndexBuffer(
            vertexData.indices.gpu.getBuffer(),
            rowVertexCount * rowVertexCount,
            (rowVertexCount - 1) * (rowVertexCount - 1) * 6,
            true,
        );

        this.vertexData = vertexData;
    }

    static Subdivide(
        indices: ChunkIndices,
        direction: Direction,
        radius: number,
        parent: TransformNode,
        terrainModel: TerrainModel,
        material: Material,
        scene: Scene,
    ): FixedLengthArray<SphericalHeightFieldChunk, 4> {
        const childIndices: Array<ChunkIndices> = [];
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                childIndices.push({
                    x: indices.x * 2 + dx,
                    y: indices.y * 2 + dy,
                    lod: indices.lod + 1,
                });
            }
        }

        const children = childIndices.map(
            (childIndex) =>
                new SphericalHeightFieldChunk(childIndex, direction, radius, parent, terrainModel, material, scene),
        );

        if (
            children[0] === undefined ||
            children[1] === undefined ||
            children[2] === undefined ||
            children[3] === undefined
        ) {
            throw new Error("Failed to create all children for SphericalHeightFieldChunk.");
        }

        return [children[0], children[1], children[2], children[3]];
    }

    private updateLoadingState(chunkForge: ChunkForge) {
        if (this.loadingState === "completed") {
            return;
        }

        const cachedVertexData = chunkForge.getOutput(this.id);
        if (cachedVertexData !== undefined) {
            if (cachedVertexData.type === "chunkForgePendingOutput") {
                return;
            }

            this.setVertexData(cachedVertexData, chunkForge.rowVertexCount, this.mesh.getScene().getEngine());
            this.loadingState = "completed";
            return;
        }

        this.loadingState = "in_progress";

        chunkForge.pushTask(
            this.id,
            this.positionOnCube,
            this.mesh.position,
            this.direction,
            this.sideLength,
            this.sphereRadius,
            this.terrainModel,
        );
    }

    public updateSubdivision(camera: Camera, material: Material) {
        const planetInverseWorldMatrix = this.parent.getWorldMatrix().clone().invert();

        const cameraPositionPlanetSpace = Vector3.TransformCoordinates(camera.globalPosition, planetInverseWorldMatrix);

        const cameraUpDirection = cameraPositionPlanetSpace.normalizeToNew();

        const cameraHeightAboveSphere = Vector3.Dot(cameraPositionPlanetSpace, cameraUpDirection) - this.sphereRadius;

        const chunkGreatCircleDistance = Math.acos(
            clamp(Vector3.Dot(this.getTransform().position.normalizeToNew(), cameraUpDirection), -1, 1),
        );

        const chunkGreatDistanceFactor = Math.max(
            0.0,
            chunkGreatCircleDistance - (8 * this.sideLength) / (2.0 * Math.PI * this.sphereRadius),
        );
        const observerDistanceFactor = Math.max(0.0, cameraHeightAboveSphere) / this.sphereRadius;

        const minDepth = 0;

        // max depth is minimal depth to get a certain minimum space between vertices
        const maxDepth = Math.ceil(
            Math.log2(
                (2.0 * this.sphereRadius) / (Settings.MIN_DISTANCE_BETWEEN_VERTICES * Settings.VERTEX_RESOLUTION),
            ),
        );

        let kernel = maxDepth;
        kernel -= Math.log2(1.0 + chunkGreatDistanceFactor * 2 ** (maxDepth - minDepth)) * 0.8;
        kernel -= Math.log2(1.0 + observerDistanceFactor * 2 ** (maxDepth - minDepth)) * 0.8;

        const targetLOD = clamp(Math.floor(kernel), minDepth, maxDepth);

        if (this.children === null && this.indices.lod < targetLOD) {
            this.children = SphericalHeightFieldChunk.Subdivide(
                this.indices,
                this.direction,
                this.sphereRadius,
                this.parent,
                this.terrainModel,
                material,
                this.getTransform().getScene(),
            );
        } else if (this.children !== null && this.indices.lod >= targetLOD && this.getLoadingState() === "completed") {
            for (const child of this.children) {
                child.dispose();
            }
            this.children = null;
        }
    }

    public update(camera: Camera, material: Material, chunkForge: ChunkForge) {
        this.updateLoadingState(chunkForge);

        this.updateSubdivision(camera, material);

        if (this.children !== null) {
            let areAllChildrenLoaded = true;
            for (const child of this.children) {
                child.update(camera, material, chunkForge);
                if (child.getLoadingState() !== "completed") {
                    areAllChildrenLoaded = false;
                }
            }

            this.getTransform().setEnabled(!areAllChildrenLoaded);
        } else if (this.getLoadingState() === "completed") {
            this.getTransform().setEnabled(true);
        }
    }

    public getTransform(): TransformNode {
        return this.mesh;
    }

    public getLoadingState(): ChunkLoadingState {
        return this.loadingState;
    }

    public getAllChildren(): Array<SphericalHeightFieldChunk> {
        if (this.children === null) {
            return [];
        }

        let children: Array<SphericalHeightFieldChunk> = [...this.children];
        for (const child of this.children) {
            children = children.concat(child.getAllChildren());
        }

        return children;
    }

    public dispose(): void {
        this.getTransform().dispose();
        this.children?.forEach((child) => {
            child.dispose();
        });
    }
}
