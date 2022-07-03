import { Vector3 } from "@babylonjs/core";

import { PlanetChunk } from "./planetChunk";
import { Direction } from "../utils/direction";
import { ChunkForge } from "./chunkForge";
import { DeleteTask, TaskType } from "./taskInterfaces";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { rayIntersectSphere } from "../utils/math";
import { Settings } from "../settings";
import { getChunkSphereSpacePositionFromPath } from "../utils/chunkUtils";

/**
 * A quadTree is defined recursively
 */
type quadTree = quadTree[] | PlanetChunk;

/**
 * A ChunkTree is a structure designed to manage LOD using a quadtree
 */
export class ChunkTree {
    readonly minDepth: number; // minimum depth of the tree
    readonly maxDepth: number; // maximum depth of the tree

    private tree: quadTree = [];

    private readonly rootChunkLength: number;

    private readonly direction: Direction;

    private readonly chunkForge: ChunkForge;

    readonly planet: TelluricPlanet;

    /**
     *
     * @param direction
     * @param planet
     */
    constructor(direction: Direction, planet: TelluricPlanet) {
        this.rootChunkLength = planet.getDiameter();

        this.minDepth = Math.max(Math.round(Math.log2(this.rootChunkLength / 2) - 19), 0);
        this.maxDepth = Math.max(Math.round(Math.log2(this.rootChunkLength / 2) - 12), 0);
        //let spaceBetweenVertex = this.rootChunkLength / (64 * 2 ** this.maxDepth);
        //console.log(spaceBetweenVertex);

        this.chunkForge = planet.starSystem.getChunkForge();

        this.direction = direction;

        this.planet = planet;
    }

    /**
     * Function used to execute code on every chunk of the quadtree
     * @param tree the tree to explore
     * @param f the function to apply on every chunk
     */
    public executeOnEveryChunk(f: (chunk: PlanetChunk) => void, tree: quadTree = this.tree): void {
        if (tree instanceof PlanetChunk) f(tree);
        else for (const stem of tree) this.executeOnEveryChunk(f, stem);
    }

    /**
     * Send deletion request to chunkforge regarding the chunks of a branch
     * @param tree The tree to delete
     * @param newChunks
     * @param isFiner
     */
    private requestDeletion(tree: quadTree, newChunks: PlanetChunk[], isFiner: boolean): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            let deleteTask: DeleteTask = {
                type: TaskType.Deletion,
                chunk: chunk,
                newChunks: newChunks,
                isFiner: isFiner
            };
            this.chunkForge?.addTask(deleteTask);
        }, tree);
    }

    /**
     * Update tree to create matching LOD relative to the observer's position
     * @param observerPosition The observer position
     */
    public update(observerPosition: Vector3): void {
        this.tree = this.updateLODRecursively(observerPosition);
    }

    /**
     * Recursive function used internaly to update LOD
     * @param observerPositionW The observer position in world space
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    private updateLODRecursively(observerPositionW: Vector3, tree: quadTree = this.tree, walked: number[] = []): quadTree {
        let nodeRelativePosition = getChunkSphereSpacePositionFromPath(walked, this.direction, this.planet);
        let nodePositionW = nodeRelativePosition.add(this.planet.getAbsolutePosition());

        let direction = nodePositionW.subtract(observerPositionW);
        let distanceToNodeSquared = direction.lengthSquared();

        let distanceThreshold = (Settings.RENDER_DISTANCE_MULTIPLIER * this.rootChunkLength) / 2 ** walked.length;

        if ((distanceToNodeSquared < distanceThreshold ** 2 && walked.length < this.maxDepth) || walked.length < this.minDepth) {
            // if the node is near the camera or if we are loading minimal LOD
            if (tree instanceof PlanetChunk) {
                if (tree.isReady()) {
                    let newTree = [
                        this.createChunk(walked.concat([0]), true),
                        this.createChunk(walked.concat([1]), true),
                        this.createChunk(walked.concat([2]), true),
                        this.createChunk(walked.concat([3]), true)
                    ];
                    this.requestDeletion(tree, newTree, true);
                    return newTree;
                }
                return tree;
            }
            return [
                this.updateLODRecursively(observerPositionW, tree[0], walked.concat([0])),
                this.updateLODRecursively(observerPositionW, tree[1], walked.concat([1])),
                this.updateLODRecursively(observerPositionW, tree[2], walked.concat([2])),
                this.updateLODRecursively(observerPositionW, tree[3], walked.concat([3]))
            ];
        } else {
            // if we are far from the node
            if (tree instanceof PlanetChunk) {
                this.checkForOcclusion(tree, nodePositionW, observerPositionW);
                return tree;
            }
            if (walked.length >= this.minDepth) {
                let newChunk = this.createChunk(walked, false);
                this.requestDeletion(tree, [newChunk], false);
                return newChunk;
            }
            return tree;
        }
    }

    //TODO: put this somewhere else for generalization purposes
    private checkForOcclusion(chunk: PlanetChunk, chunkPositionW: Vector3, observerPositionW: Vector3) {
        if (chunk.isReady() && Settings.ENABLE_OCCLUSION) {
            let direction = chunkPositionW.subtract(observerPositionW);
            let rayDir = direction.normalizeToNew();
            let [intersect, t0, t1] = rayIntersectSphere(observerPositionW, rayDir, this.planet.getAbsolutePosition(), this.planet.getRadius() - 50e3 * 2 ** -chunk.depth);
            chunk.mesh.setEnabled(!(intersect && t0 ** 2 < direction.lengthSquared()));
        }
    }

    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @param isFiner
     * @returns The new Chunk
     */
    private createChunk(path: number[], isFiner: boolean): PlanetChunk {
        return new PlanetChunk(path, this.direction, this.chunkForge, this, isFiner);
    }

    /**
     * Regenerate planet chunks
     */
    public reset(): void {
        let newTree = this.createChunk([], true);
        this.requestDeletion(this.tree, [newTree], false);
        this.tree = newTree;
    }
}
