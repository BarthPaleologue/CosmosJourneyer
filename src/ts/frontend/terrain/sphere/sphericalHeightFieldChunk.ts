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
import { Camera } from "@babylonjs/core/Cameras/camera";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { type Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getQuaternionFromDirection, type Direction } from "@/utils/direction";
import { type FixedLengthArray } from "@/utils/types";

import { Settings } from "@/settings";

import { type ChunkForge, type ChunkForgeCompletedOutput, type ChunkId } from "./chunkForge";

type ChunkLoadingState = "not_started" | "in_progress" | "completed";

export type ChunkIndices = {
    x: number;
    y: number;
    lod: number;
};

type ChunkBounds = {
    corners: FixedLengthArray<Vector3, 4>;
    center: Vector3;
    radius: number;
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

    private readonly material: Material;

    private readonly faceIndex: Direction;

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

    private geometry: {
        buffers: ChunkForgeCompletedOutput;
        boundsPlanetSpace: ChunkBounds;
        error: number;
    } | null = null;

    private readonly terrainModel: TerrainModel;

    private readonly scene: Scene;

    constructor(
        indices: ChunkIndices,
        faceIndex: Direction,
        sphereRadius: number,
        parent: TransformNode,
        terrainModel: TerrainModel,
        material: Material,
        scene: Scene,
    ) {
        this.id = `${parent.name}->d${faceIndex}->l${indices.lod}->[x${indices.x};y${indices.y}]`;

        this.mesh = new Mesh(this.id, scene);
        this.mesh.isPickable = false;
        this.mesh.parent = parent;
        this.mesh.material = material;

        this.material = material;

        this.parent = parent;

        this.indices = { ...indices };

        this.terrainModel = terrainModel;

        this.mesh.position.x = -sphereRadius + (sphereRadius * 2 * (indices.x + 0.5)) / 2 ** indices.lod;
        this.mesh.position.y = -sphereRadius + (sphereRadius * 2 * (indices.y + 0.5)) / 2 ** indices.lod;
        this.mesh.position.z = sphereRadius;

        this.mesh.position.applyRotationQuaternionInPlace(getQuaternionFromDirection(faceIndex));

        this.positionOnCube = this.mesh.position.clone();

        this.mesh.position.normalize().scaleInPlace(sphereRadius);

        this.faceIndex = faceIndex;
        this.sphereRadius = sphereRadius;

        this.sideLength = (sphereRadius * 2) / 2 ** indices.lod;

        this.mesh.setEnabled(false);

        this.scene = scene;
    }

    private setVertexData(vertexData: ChunkForgeCompletedOutput, rowVertexCount: number, engine: AbstractEngine) {
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

        const corners: FixedLengthArray<Vector3, 4> = [
            Vector3.FromArray(vertexData.positions.cpu),
            Vector3.FromArray(vertexData.positions.cpu, (rowVertexCount - 1) * 3),
            Vector3.FromArray(vertexData.positions.cpu, (rowVertexCount - 1) * rowVertexCount * 3),
            Vector3.FromArray(
                vertexData.positions.cpu,
                ((rowVertexCount - 1) * rowVertexCount + (rowVertexCount - 1)) * 3,
            ),
        ];

        for (const corner of corners) {
            corner.addInPlace(this.mesh.position);
        }

        const center = corners[0].add(corners[1]).add(corners[2]).add(corners[3]).scaleInPlace(0.25);

        let radius = 0;
        for (const p of corners) radius = Math.max(radius, Vector3.Distance(center, p));

        // Curvature pad: interior of a spherical quad bows outward beyond corner chord.
        // Use sagitta of an arc as a conservative pad. Edge is the largest edge of the quad.
        const e01 = Vector3.Distance(corners[0], corners[1]);
        const e13 = Vector3.Distance(corners[1], corners[3]);
        const e32 = Vector3.Distance(corners[3], corners[2]);
        const e20 = Vector3.Distance(corners[2], corners[0]);
        const edge = Math.max(e01, e13, e32, e20);
        const sagitta = (edge * edge) / (8 * this.sphereRadius); // sphere curvature only
        radius += sagitta;

        const geometricErrorMultiplier = 2;
        const geometricError = (geometricErrorMultiplier * this.sideLength) / (rowVertexCount - 1);

        this.geometry = {
            buffers: vertexData,
            boundsPlanetSpace: {
                corners,
                center,
                radius,
            },
            error: geometricError,
        };
    }

    private subdivide(): void {
        const childIndices: Array<ChunkIndices> = [];
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                childIndices.push({
                    x: this.indices.x * 2 + dx,
                    y: this.indices.y * 2 + dy,
                    lod: this.indices.lod + 1,
                });
            }
        }

        const children = childIndices.map(
            (childIndex) =>
                new SphericalHeightFieldChunk(
                    childIndex,
                    this.faceIndex,
                    this.sphereRadius,
                    this.parent,
                    this.terrainModel,
                    this.material,
                    this.scene,
                ),
        );

        if (
            children[0] === undefined ||
            children[1] === undefined ||
            children[2] === undefined ||
            children[3] === undefined
        ) {
            throw new Error("Failed to create all children for SphericalHeightFieldChunk.");
        }

        this.children = [children[0], children[1], children[2], children[3]];
    }

    private updateLoadingState(chunkForge: ChunkForge) {
        if (this.loadingState === "completed") {
            return;
        }

        const cachedVertexData = chunkForge.getOutput(this.id);
        if (cachedVertexData !== undefined) {
            if (cachedVertexData.status === "pending") {
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
            this.faceIndex,
            this.sideLength,
            this.sphereRadius,
            this.terrainModel,
        );
    }

    public updateSubdivision(camera: Camera) {
        if (this.geometry === null) {
            // do not merge children or subdivide self if chunk is not loaded
            return;
        }

        const fovY =
            camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED
                ? camera.fov
                : (camera.fov * camera.viewport.height) / camera.viewport.width;
        const viewportHeight = camera.viewport.height * camera.getEngine().getRenderHeight();
        const projScale = viewportHeight / (2 * Math.tan(fovY * 0.5));

        const planetInverseWorldMatrix = this.parent.getWorldMatrix().clone().invert();

        const cameraPositionPlanetSpace = Vector3.TransformCoordinates(camera.globalPosition, planetInverseWorldMatrix);

        const boundingSphereCenter = this.geometry.boundsPlanetSpace.center;

        const boundingRadius = this.geometry.boundsPlanetSpace.radius;

        const distance = Math.max(
            1e-3,
            cameraPositionPlanetSpace.subtract(boundingSphereCenter).length() - boundingRadius,
        );

        const geometricError = this.geometry.error;

        const screenSpaceError = (geometricError * projScale) / distance;

        // Hysteresis
        const T_SPLIT = 16; // split when sse >= T_SPLIT px
        const T_MERGE = 8; // merge when sse <= T_MERGE px

        /*
        const screenSpaceErrorMorphWindow = 8; // pixels
        const morphFactor01 = clamp(
            screenSpaceError - (T_SPLIT - screenSpaceErrorMorphWindow) / screenSpaceErrorMorphWindow,
            0,
            1,
        );
        */

        const maxLod = Math.ceil(
            Math.log2(
                (2.0 * this.sphereRadius) /
                    (Settings.MIN_DISTANCE_BETWEEN_VERTICES * (this.geometry.buffers.rowVertexCount - 1)),
            ),
        );

        if (this.children === null && screenSpaceError >= T_SPLIT && this.indices.lod < maxLod) {
            this.subdivide();
        } else if (this.children !== null && screenSpaceError <= T_MERGE && this.getLoadingState() === "completed") {
            for (const child of this.children) {
                child.dispose();
            }
            this.children = null;
        }
    }

    public update(camera: Camera, chunkForge: ChunkForge) {
        this.updateLoadingState(chunkForge);

        this.updateSubdivision(camera);

        if (this.children !== null) {
            let areAllChildrenLoaded = true;
            for (const child of this.children) {
                child.update(camera, chunkForge);
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
