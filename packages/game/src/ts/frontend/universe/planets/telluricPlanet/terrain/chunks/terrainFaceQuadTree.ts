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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Material } from "@babylonjs/core/Materials/material";
import type { TransformNode } from "@babylonjs/core/Meshes";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { TelluricPlanetModel, TelluricSatelliteModel, TerrainSettings } from "@cosmos-journeyer/universe-model";

import type { Cullable } from "@/frontend/helpers/cullable";

import { Settings } from "@/settings";

import type { ITerrainSystem } from "../system/terrainSystem";
import type { BuildChunkInput } from "../system/terrainTaskInputs";
import { getChunkChildIndices } from "./chunkIndices";
import type { ChunkIndices } from "./chunkIndices";
import type { FaceIndex } from "./faceIndex";
import type { LodUpdateContext } from "./lodUpdateContext";
import type { IScatteringSystem } from "./scatteringSystem";
import { TerrainChunkMesh } from "./terrainChunkMesh";
import { TerrainQuadTreeNode } from "./terrainQuadTreeNode";
import type { TerrainQuadTreeChildren } from "./terrainQuadTreeNode";

const splitScreenSpaceErrorThreshold = 32;
const mergeScreenSpaceErrorThreshold = 16;

/**
 * Represents a face of a cube-sphere terrain.
 * It owns the quad-tree for the face and is responsible for handling LOD updates and culling
 */
export class TerrainFaceQuadTree implements Cullable {
    readonly minDepth: number;
    readonly maxDepth: number;

    private root: TerrainQuadTreeNode | null = null;

    private readonly rootChunkLength: number;

    private readonly faceIndex: FaceIndex;

    private readonly scene: Scene;

    readonly planetModel: DeepReadonly<TelluricPlanetModel | TelluricSatelliteModel>;

    readonly planetName: string;
    readonly planetSeed: number;
    readonly terrainSettings: TerrainSettings;

    readonly parentTransform: TransformNode;

    readonly material: Material;

    private readonly maxGpuUploadsPerFrame = 1;

    /**
     * Creates the root terrain quad tree for one cube-sphere face and retains its render dependencies.
     * @param faceIndex - The cube-sphere face index in the range 0 through 5.
     * @param planetModel - The planet model that supplies radius and terrain parameters.
     * @param parentTransform - The transform that positions this terrain face on the planet.
     * @param material - The terrain material shared by chunks on this face.
     * @param scene - The Babylon.js scene that owns the rendered meshes.
     */
    constructor(
        faceIndex: FaceIndex,
        planetModel: DeepReadonly<TelluricPlanetModel | TelluricSatelliteModel>,
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

        this.faceIndex = faceIndex;

        this.parentTransform = parentTransform;

        this.material = material;
    }

    /**
     * Splits or merges this face’s terrain quad tree to match the observer’s level of detail.
     * @param lodContext Shared LOD state computed once for the terrain update
     * @param terrainSystem - The terrain worker system that creates and retires terrain chunks.
     * @param scatteringSystem - The atmosphere-scattering system used to update terrain shading.
     */
    public updateLOD(
        lodContext: LodUpdateContext,
        terrainSystem: ITerrainSystem,
        scatteringSystem: IScatteringSystem,
    ): void {
        this.root ??= this.createNode(
            {
                lod: 0,
                x: 0,
                y: 0,
            },
            terrainSystem,
            scatteringSystem,
        );

        this.uploadCompletedChunks(terrainSystem);

        this.updateLODRecursively(lodContext, terrainSystem, scatteringSystem, this.root);
        this.root.updateVisibility();

        for (const chunk of this.root.getChunks()) {
            chunk.updatePosition();
        }
    }

    private uploadCompletedChunks(terrainSystem: ITerrainSystem): void {
        if (this.root === null) {
            return;
        }

        let remainingGpuUploads = this.maxGpuUploadsPerFrame;

        const unloadedChunks = this.root
            .getChunks()
            .filter((chunk) => !chunk.isLoaded())
            .toArray()
            .sort(sortLodAscending);

        for (const chunk of unloadedChunks) {
            if (remainingGpuUploads === 0) {
                break;
            }

            const chunkOutput = terrainSystem.getChunkOutput(chunk.id);
            if (chunkOutput === undefined || chunkOutput.status === "failed") {
                this.requestChunkBuild(chunk, terrainSystem);
                continue;
            } else if (chunkOutput.status !== "chunkComputed") {
                continue;
            }

            chunk.init(chunkOutput.buffers);
            remainingGpuUploads--;
        }
    }

    /**
     * Updates a terrain node and its descendants against the shared level-of-detail context.
     * @param lodContext Shared LOD state computed once for the terrain update
     * @param terrainSystem - The terrain worker system that creates and retires terrain chunks.
     * @param scatteringSystem - The atmosphere-scattering system used to update terrain shading.
     * @param node The node to update recursively
     */
    private updateLODRecursively(
        lodContext: LodUpdateContext,
        terrainSystem: ITerrainSystem,
        scatteringSystem: IScatteringSystem,
        node: TerrainQuadTreeNode,
    ): void {
        if (node.chunk.indices.lod === this.maxDepth) {
            return;
        }

        const children = node.getChildren();
        const screenSpaceError = node.chunk.computeScreenSpaceError(lodContext);

        if (children !== null && screenSpaceError <= mergeScreenSpaceErrorThreshold) {
            node.disposeChildren();
            node.chunk.setActiveForLOD(true);
            return;
        }

        if (children === null && screenSpaceError >= splitScreenSpaceErrorThreshold) {
            if (!node.canBeSubdivided()) {
                return;
            }

            node.setChildren(this.createChildren(node.chunk.indices, terrainSystem, scatteringSystem));
        }

        const updatedChildren = node.getChildren();
        if (updatedChildren === null) {
            return;
        }

        for (const child of updatedChildren) {
            this.updateLODRecursively(lodContext, terrainSystem, scatteringSystem, child);
        }
    }

    private createChildren(
        parentIndices: ChunkIndices,
        terrainSystem: ITerrainSystem,
        scatteringSystem: IScatteringSystem,
    ): TerrainQuadTreeChildren {
        return [
            this.createNode(getChunkChildIndices(parentIndices, 0), terrainSystem, scatteringSystem),
            this.createNode(getChunkChildIndices(parentIndices, 1), terrainSystem, scatteringSystem),
            this.createNode(getChunkChildIndices(parentIndices, 2), terrainSystem, scatteringSystem),
            this.createNode(getChunkChildIndices(parentIndices, 3), terrainSystem, scatteringSystem),
        ];
    }

    private createNode(
        indices: ChunkIndices,
        terrainSystem: ITerrainSystem,
        scatteringSystem: IScatteringSystem,
    ): TerrainQuadTreeNode {
        const chunk = new TerrainChunkMesh(
            indices,
            this.faceIndex,
            this.parentTransform,
            this.material,
            this.planetModel,
            scatteringSystem,
            this.scene,
        );

        this.requestChunkBuild(chunk, terrainSystem);

        return new TerrainQuadTreeNode(chunk);
    }

    private requestChunkBuild(chunk: TerrainChunkMesh, terrainSystem: ITerrainSystem): void {
        const input: BuildChunkInput = {
            planetModel: this.planetModel,
            position: chunk.positionOnCube,
            depth: chunk.indices.lod,
            faceIndex: this.faceIndex,
        };

        terrainSystem.requestChunk(chunk.id, input);
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

/**
 * Orders terrain levels by increasing subdivision depth.
 * @param a - First terrain detail level to compare.
 * @param b - Second terrain detail level to compare.
 * @returns A negative value, zero, or positive value according to ascending LOD order.
 */
function sortLodAscending(a: TerrainChunkMesh, b: TerrainChunkMesh): number {
    return a.indices.lod - b.indices.lod;
}
