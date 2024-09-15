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

import { PlanetChunk } from "./planetChunk";
import { Direction } from "../../../../utils/direction";
import { BuildTask, TaskType } from "./taskTypes";
import { Settings } from "../../../../settings";
import { getChunkSphereSpacePositionFromPath } from "../../../../utils/chunkUtils";
import { TerrainSettings } from "../terrainSettings";
import { TelluricPlanetModel } from "../../telluricPlanetModel";
import { Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { DeleteSemaphore } from "./deleteSemaphore";
import { getRotationQuaternion } from "../../../../uberCore/transforms/basicTransform";
import { ChunkForge } from "./chunkForge";
import { clamp } from "../../../../utils/math";
import { Cullable } from "../../../../utils/cullable";
import { Scene } from "@babylonjs/core/scene";

/**
 * A quadTree is defined recursively
 */
type QuadTree = QuadTree[] | PlanetChunk;

/**
 * A ChunkTree is a structure designed to manage LOD using a quadtree
 */
export class ChunkTree implements Cullable {
    readonly minDepth: number; // minimum depth of the tree
    readonly maxDepth: number; // maximum depth of the tree

    private tree: QuadTree = [];

    private readonly rootChunkLength: number;

    private readonly direction: Direction;

    private readonly scene: Scene;

    private deleteSemaphores: DeleteSemaphore[] = [];

    readonly planetModel: TelluricPlanetModel;

    readonly planetName: string;
    readonly planetSeed: number;
    readonly terrainSettings: TerrainSettings;

    readonly parent: TransformNode;
    readonly parentAggregate: PhysicsAggregate;

    readonly material: Material;

    /**
     *
     * @param direction
     * @param planetName
     * @param planetModel
     * @param parentAggregate
     * @param material
     * @param scene
     */
    constructor(direction: Direction, planetName: string, planetModel: TelluricPlanetModel, parentAggregate: PhysicsAggregate, material: Material, scene: Scene) {
        this.rootChunkLength = planetModel.radius * 2;
        this.planetName = planetName;
        this.planetSeed = planetModel.seed;
        this.terrainSettings = planetModel.terrainSettings;

        this.planetModel = planetModel;

        this.minDepth = 0;

        // max depth is minimal depth to get a certain minimum space between vertices
        this.maxDepth = Math.ceil(Math.log2(this.rootChunkLength / (Settings.MIN_DISTANCE_BETWEEN_VERTICES * Settings.VERTEX_RESOLUTION)));

        this.scene = scene;

        this.direction = direction;

        this.parent = parentAggregate.transformNode;
        this.parentAggregate = parentAggregate;

        this.material = material;
    }

    /**
     * Function used to execute code on every chunk of the quadtree
     * @param tree the tree to explore
     * @param f the function to apply on every chunk
     */
    public executeOnEveryChunk(f: (chunk: PlanetChunk) => void, tree: QuadTree = this.tree): void {
        if (tree instanceof PlanetChunk) f(tree);
        else for (const stem of tree) this.executeOnEveryChunk(f, stem);
    }

    /**
     * Creates deletion semaphores for the tree (we will delete the chunks only when the new ones are ready)
     * @param tree The tree to delete
     * @param newChunks
     */
    private requestDeletion(tree: QuadTree, newChunks: PlanetChunk[]): void {
        const chunksToDelete = this.getChunkList(tree);
        this.deleteSemaphores.push(new DeleteSemaphore(newChunks, chunksToDelete));
    }

    public getChunkList(tree: QuadTree): PlanetChunk[] {
        const result: PlanetChunk[] = [];
        this.executeOnEveryChunk((chunk) => result.push(chunk), tree);
        return result;
    }

    /**
     * Update tree to create matching LOD relative to the observer's position
     * @param observerPosition The observer position
     * @param chunkForge
     */
    public update(observerPosition: Vector3, chunkForge: ChunkForge): void {
        this.deleteSemaphores.forEach((semaphore) => semaphore.update());
        // remove delete semaphores that have been resolved
        this.deleteSemaphores = this.deleteSemaphores.filter((semaphore) => !semaphore.isResolved());

        this.tree = this.updateLODRecursively(observerPosition, chunkForge);

        this.executeOnEveryChunk((chunk) => {
            chunk.updatePosition();
        });
    }

    private getAverageHeight(tree: QuadTree): number {
        if (tree instanceof PlanetChunk) return tree.getAverageHeight();
        else if (tree.length > 0) return 0.25 * (this.getAverageHeight(tree[0]) + this.getAverageHeight(tree[1]) + this.getAverageHeight(tree[2]) + this.getAverageHeight(tree[3]));
        else return 0;
    }

    private getMinAverageHeight(tree: QuadTree): number {
        if (tree instanceof PlanetChunk) return tree.getAverageHeight();
        else if (tree.length > 0)
            return Math.min(this.getMinAverageHeight(tree[0]), this.getMinAverageHeight(tree[1]), this.getMinAverageHeight(tree[2]), this.getMinAverageHeight(tree[3]));
        else return 0;
    }

    private getMaxAverageHeight(tree: QuadTree): number {
        if (tree instanceof PlanetChunk) return tree.getAverageHeight();
        else if (tree.length > 0)
            return Math.max(this.getMaxAverageHeight(tree[0]), this.getMaxAverageHeight(tree[1]), this.getMaxAverageHeight(tree[2]), this.getMaxAverageHeight(tree[3]));
        else return 0;
    }

    /**
     * Recursive function used internaly to update LOD
     * @param observerPositionW The observer position in world space
     * @param chunkForge
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    private updateLODRecursively(observerPositionW: Vector3, chunkForge: ChunkForge, tree: QuadTree = this.tree, walked: number[] = []): QuadTree {
        if (walked.length === this.maxDepth) return tree;

        const nodeRelativePosition = getChunkSphereSpacePositionFromPath(walked, this.direction, this.rootChunkLength / 2, getRotationQuaternion(this.parent));

        const nodePositionSphere = nodeRelativePosition.normalizeToNew();
        const observerPositionSphere = observerPositionW.subtract(this.parent.getAbsolutePosition()).normalize();

        const totalRadius =
            this.planetModel.radius +
            (this.planetModel.terrainSettings.max_mountain_height + this.planetModel.terrainSettings.continent_base_height + this.planetModel.terrainSettings.max_bump_height) *
                0.5;

        const observerRelativePosition = observerPositionW.subtract(this.parent.getAbsolutePosition());
        const observerDistanceToCenter = observerRelativePosition.length();

        const nodeGreatCircleDistance = Math.acos(Vector3.Dot(nodePositionSphere, observerPositionSphere));
        const nodeLength = this.rootChunkLength / 2 ** walked.length;

        const chunkGreatDistanceFactor = Math.max(0.0, nodeGreatCircleDistance - (8 * nodeLength) / (2 * Math.PI * this.planetModel.radius));
        const observerDistanceFactor = Math.max(0.0, observerDistanceToCenter - totalRadius) / this.planetModel.radius;

        let kernel = this.maxDepth;
        kernel -= Math.log2(1.0 + chunkGreatDistanceFactor * 2 ** (this.maxDepth - this.minDepth)) * 0.8;
        kernel -= Math.log2(1.0 + observerDistanceFactor * 2 ** (this.maxDepth - this.minDepth)) * 0.8;

        const targetLOD = clamp(Math.floor(kernel), this.minDepth, this.maxDepth);

        if (tree instanceof PlanetChunk && targetLOD > walked.length) {
            if (!tree.isLoaded()) return tree;
            if (!tree.mesh.isVisible) return tree;
            if (!tree.mesh.isEnabled()) return tree;

            const newTree = [
                this.createChunk(walked.concat([0]), chunkForge),
                this.createChunk(walked.concat([1]), chunkForge),
                this.createChunk(walked.concat([2]), chunkForge),
                this.createChunk(walked.concat([3]), chunkForge)
            ];
            this.requestDeletion(tree, newTree);
            return newTree;
        }

        if (tree instanceof Array) {
            if (targetLOD < walked.length - 1) {
                const newChunk = this.createChunk(walked, chunkForge);
                this.requestDeletion(tree, [newChunk]);
                return newChunk;
            }

            return [
                this.updateLODRecursively(observerPositionW, chunkForge, tree[0], walked.concat([0])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[1], walked.concat([1])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[2], walked.concat([2])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[3], walked.concat([3]))
            ];
        }

        return tree;
    }

    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @param chunkForge
     * @returns The new Chunk
     */
    private createChunk(path: number[], chunkForge: ChunkForge): PlanetChunk {
        const chunk = new PlanetChunk(path, this.direction, this.parentAggregate, this.material, this.planetModel, this.rootChunkLength, this.scene);

        const buildTask: BuildTask = {
            type: TaskType.BUILD,
            planetName: this.planetName,
            planetSeed: this.planetSeed,
            planetDiameter: this.rootChunkLength,
            terrainSettings: this.terrainSettings,
            position: chunk.cubePosition,
            depth: path.length,
            direction: this.direction,
            chunk: chunk
        };

        chunkForge.addTask(buildTask);

        return chunk;
    }

    public computeCulling(cameras: Camera[]): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            chunk.computeCulling(cameras);
        });
    }

    public dispose(): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            chunk.dispose();
        });
        this.tree = [];

        this.deleteSemaphores.forEach((deleteSemaphore) => {
            deleteSemaphore.dispose();
        });
        this.deleteSemaphores.length = 0;
    }
}
