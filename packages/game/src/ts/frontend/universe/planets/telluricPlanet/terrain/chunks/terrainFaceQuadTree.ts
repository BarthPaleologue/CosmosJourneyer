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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { type Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";
import {
    type TelluricPlanetModel,
    type TelluricSatelliteModel,
    type TerrainSettings,
} from "@cosmos-journeyer/universe-model";

import { type Cullable } from "@/frontend/helpers/cullable";
import { getRotationQuaternion } from "@/frontend/helpers/transform";

import { clamp } from "@/utils/math";
import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { type ChunkForge } from "./chunkForge";
import { getChunkChildIndices, getChunkSphereSpacePosition, type ChunkIndices } from "./chunkUtils";
import { type Direction } from "./direction";
import type { IScatteringSystem } from "./scatteringSystem";
import { type BuildTask } from "./taskTypes";
import { TerrainChunkMesh } from "./terrainChunkMesh";
import { TerrainQuadTreeNode, type TerrainQuadTreeChildren } from "./terrainQuadTreeNode";

/**
 * Represents a face of a cube-sphere terrain.
 * It owns the quad-tree for the face and is responsible for handling LOD updates and culling
 */
export class TerrainFaceQuadTree implements Cullable {
    readonly minDepth: number;
    readonly maxDepth: number;

    private root: TerrainQuadTreeNode | null = null;

    private readonly rootChunkLength: number;

    private readonly direction: Direction;

    private readonly scene: Scene;

    readonly planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;

    readonly planetName: string;
    readonly planetSeed: number;
    readonly terrainSettings: TerrainSettings;

    readonly parentTransform: TransformNode;

    readonly material: Material;

    private readonly maxGpuUploadsPerFrame = 1;
    private remainingGpuUploads = this.maxGpuUploadsPerFrame;

    /**
     *
     * @param direction
     * @param planetModel
     * @param parentTransform
     * @param material
     * @param scene
     */
    constructor(
        direction: Direction,
        planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        parentTransform: TransformNode,
        material: Material,
        scene: Scene,
    ) {
        this.rootChunkLength = planetModel.radius * 2;
        this.planetName = planetModel.name;
        this.planetSeed = planetModel.seed;
        this.terrainSettings = planetModel.terrainSettings;

        this.planetModel = planetModel;

        this.minDepth = 0;

        // max depth is minimal depth to get a certain minimum space between vertices
        this.maxDepth = Math.ceil(
            Math.log2(this.rootChunkLength / (Settings.MIN_DISTANCE_BETWEEN_VERTICES * Settings.VERTEX_RESOLUTION)),
        );

        this.scene = scene;

        this.direction = direction;

        this.parentTransform = parentTransform;

        this.material = material;
    }

    /**
     * Update tree to create matching LOD relative to the observer's position
     * @param observerPosition The observer position
     * @param chunkForge
     */
    public updateLOD(observerPosition: Vector3, chunkForge: ChunkForge, scatteringSystem: IScatteringSystem): void {
        this.remainingGpuUploads = this.maxGpuUploadsPerFrame;
        if (this.root === null) {
            this.root = this.createNode(
                {
                    lod: 0,
                    x: 0,
                    y: 0,
                },
                chunkForge,
                scatteringSystem,
            );
        }

        this.updateLODRecursively(observerPosition, chunkForge, scatteringSystem, this.root);
        this.root.updateVisibility();

        for (const chunk of this.root.getChunks()) {
            chunk.updatePosition();
        }
    }

    /**
     * Recursive function used internally to update LOD
     * @param observerPositionW The observer position in world space
     * @param chunkForge
     * @param node The node to update recursively
     */
    private updateLODRecursively(
        observerPositionW: Vector3,
        chunkForge: ChunkForge,
        scatteringSystem: IScatteringSystem,
        node: TerrainQuadTreeNode,
    ): void {
        if (!node.chunk.isLoaded()) {
            const chunkOutput = chunkForge.getOutput(node.chunk.id);
            if (chunkOutput !== undefined && chunkOutput.status === "completed" && this.remainingGpuUploads > 0) {
                node.chunk.init(chunkOutput);
                this.remainingGpuUploads -= 1;
            }
        }

        if (node.chunk.indices.lod === this.maxDepth) {
            return;
        }

        const targetLOD = this.computeTargetLOD(observerPositionW, node.chunk.indices);
        const children = node.getChildren();

        if (targetLOD <= node.chunk.indices.lod) {
            if (children !== null) {
                node.disposeChildren();
                node.chunk.setActiveForLOD(true);
            }
            return;
        }

        if (children === null) {
            if (!node.canBeSubdivided()) {
                return;
            }

            node.setChildren(this.createChildren(node.chunk.indices, chunkForge, scatteringSystem));
        }

        const updatedChildren = node.getChildren();
        if (updatedChildren === null) {
            return;
        }

        for (const child of updatedChildren) {
            this.updateLODRecursively(observerPositionW, chunkForge, scatteringSystem, child);
        }
    }

    private computeTargetLOD(observerPositionW: Vector3, chunkIndices: ChunkIndices): number {
        const nodeRelativePosition = getChunkSphereSpacePosition(
            chunkIndices,
            this.direction,
            this.rootChunkLength / 2,
            getRotationQuaternion(this.parentTransform),
        );

        const nodePositionSphere = nodeRelativePosition.normalizeToNew();
        const observerPositionSphere = observerPositionW
            .subtract(this.parentTransform.getAbsolutePosition())
            .normalize();

        const totalRadius =
            this.planetModel.radius +
            0.5 * this.planetModel.terrainSettings.max_mountain_height +
            this.planetModel.terrainSettings.continent_base_height +
            0.5 * this.planetModel.terrainSettings.max_bump_height;

        const observerRelativePosition = observerPositionW.subtract(this.parentTransform.getAbsolutePosition());
        const observerDistanceToCenter = observerRelativePosition.length();

        const nodeGreatCircleDistance = Math.acos(Vector3.Dot(nodePositionSphere, observerPositionSphere));
        const nodeLength = this.rootChunkLength / 2 ** chunkIndices.lod;

        const chunkGreatDistanceFactor = Math.max(
            0.0,
            nodeGreatCircleDistance - (8 * nodeLength) / (2 * Math.PI * this.planetModel.radius),
        );
        const observerDistanceFactor = Math.max(0.0, observerDistanceToCenter - totalRadius) / this.planetModel.radius;

        let kernel = this.maxDepth;
        kernel -= Math.log2(1.0 + chunkGreatDistanceFactor * 2 ** (this.maxDepth - this.minDepth)) * 0.8;
        kernel -= Math.log2(1.0 + observerDistanceFactor * 2 ** (this.maxDepth - this.minDepth)) * 0.8;

        return clamp(Math.floor(kernel), this.minDepth, this.maxDepth);
    }

    private createChildren(
        parentIndices: ChunkIndices,
        chunkForge: ChunkForge,
        scatteringSystem: IScatteringSystem,
    ): TerrainQuadTreeChildren {
        return [
            this.createNode(getChunkChildIndices(parentIndices, 0), chunkForge, scatteringSystem),
            this.createNode(getChunkChildIndices(parentIndices, 1), chunkForge, scatteringSystem),
            this.createNode(getChunkChildIndices(parentIndices, 2), chunkForge, scatteringSystem),
            this.createNode(getChunkChildIndices(parentIndices, 3), chunkForge, scatteringSystem),
        ];
    }

    private createNode(
        indices: ChunkIndices,
        chunkForge: ChunkForge,
        scatteringSystem: IScatteringSystem,
    ): TerrainQuadTreeNode {
        const chunk = new TerrainChunkMesh(
            indices,
            this.direction,
            this.parentTransform,
            this.material,
            this.planetModel,
            scatteringSystem,
            this.scene,
        );

        const chunkOutput = chunkForge.getOutput(chunk.id);
        if (chunkOutput === undefined) {
            const buildTask: BuildTask = {
                chunkId: chunk.id,
                planetModel: this.planetModel,
                position: chunk.cubePosition,
                depth: chunk.indices.lod,
                direction: this.direction,
            };

            chunkForge.addTask(buildTask);
        }

        return new TerrainQuadTreeNode(chunk);
    }

    public isIdle(): boolean {
        if (this.root === null) {
            return false;
        }

        return this.root.isIdle();
    }

    public computeCulling(camera: Camera): void {
        if (this.root === null) {
            return;
        }

        for (const chunk of this.root.getChunks()) {
            chunk.computeCulling(camera);
        }
    }

    public dispose(): void {
        if (this.root !== null) {
            this.root.dispose();
        }
        this.root = null;
    }
}
