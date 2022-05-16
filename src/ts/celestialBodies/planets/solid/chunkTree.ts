import {Vector3} from "@babylonjs/core";

import {getChunkSphereSpacePositionFromPath, PlanetChunk} from "./planetChunk";
import {Direction} from "../../../utils/direction";
import {ChunkForge} from "../../../forge/chunkForge";
import {DeleteTask, TaskType} from "../../../forge/taskInterfaces";
import {SolidPlanet} from "./solidPlanet";
import {rayIntersectSphere} from "../../../utils/math";

/**
 * A quadTree is defined recursively
 */
type quadTree = quadTree[] | PlanetChunk;

/**
 * A ChunkTree is a structure designed to manage LOD using a quadtree
 */
export class ChunkTree {

    private readonly minDepth: number; // minimum depth of the tree
    private readonly maxDepth: number; // maximum depth of the tree

    private tree: quadTree = [];

    // FIXME: get rid of this one
    renderDistanceFactor = 2;

    private readonly rootChunkLength: number;

    private readonly direction: Direction;

    private readonly chunkForge: ChunkForge;

    private readonly planet: SolidPlanet;

    /**
     *
     * @param direction
     * @param planet
     */
    constructor(direction: Direction, planet: SolidPlanet) {

        this.rootChunkLength = planet.getDiameter();

        this.minDepth = Math.max(Math.round(Math.log2(this.rootChunkLength / 2) - 19), 0);
        this.maxDepth = Math.max(Math.round(Math.log2(this.rootChunkLength / 2) - 12), 0);
        //let spaceBetweenVertex = this.rootChunkLength / (64 * 2 ** this.maxDepth);
        //console.log(spaceBetweenVertex);

        this.chunkForge = planet._starSystemManager.getChunkForge();

        this.direction = direction;

        this.planet = planet;
    }

    /**
     * Function used to execute code on every chunk of the quadtree
     * @param tree the tree to explore
     * @param f the function to apply on every chunk
     */
    public executeOnEveryChunk(f: (chunk: PlanetChunk) => void, tree: quadTree = this.tree): void {
        if (tree instanceof PlanetChunk) {
            f(tree);
        } else {
            for (let stem of tree) this.executeOnEveryChunk(f, stem);
        }
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
                taskType: TaskType.Deletion,
                chunk: chunk,
                newChunks: newChunks,
                isFiner: isFiner
            }
            this.chunkForge?.addTask(deleteTask);
        }, tree);
    }

    /**
     * Update LOD of terrain relative to the observerPosition
     * @param observerPosition The observer position
     * @param observerDirection
     */
    public updateLOD(observerPosition: Vector3, observerDirection: Vector3): void {
        this.tree = this.updateLODRecursively(observerPosition, observerDirection);
    }

    /**
     * Recursive function used internaly to update LOD
     * @param observerPosition The observer position
     * @param observerDirection
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    private updateLODRecursively(observerPosition: Vector3, observerDirection: Vector3, tree: quadTree = this.tree, walked: number[] = []): quadTree {
        // position du noeud du quadtree par rapport à la sphère 
        let relativePosition = getChunkSphereSpacePositionFromPath(this.rootChunkLength, walked, this.direction, this.planet.getRotationQuaternion());

        // position par rapport à la caméra
        let planetPosition = this.planet.getAbsolutePosition().clone();
        let absolutePosition = relativePosition.add(planetPosition);
        let direction = absolutePosition.subtract(observerPosition);
        // distance carré entre caméra et noeud du quadtree
        let distanceToNodeSquared = direction.lengthSquared();
        let distanceThreshold = this.renderDistanceFactor * this.rootChunkLength / (2 ** walked.length);

        if ((distanceToNodeSquared < distanceThreshold ** 2 && walked.length < this.maxDepth) || walked.length < this.minDepth) {
            // if the node is near the camera or if we are loading minimal LOD
            if (tree instanceof PlanetChunk) {
                if (tree.isReady()) {
                    let newTree = [
                        this.createChunk(walked.concat([0]), true),
                        this.createChunk(walked.concat([1]), true),
                        this.createChunk(walked.concat([2]), true),
                        this.createChunk(walked.concat([3]), true),
                    ];
                    this.requestDeletion(tree, newTree, true);
                    return newTree;
                }
                return tree;
            }
            return [
                this.updateLODRecursively(observerPosition, observerDirection, tree[0], walked.concat([0])),
                this.updateLODRecursively(observerPosition, observerDirection, tree[1], walked.concat([1])),
                this.updateLODRecursively(observerPosition, observerDirection, tree[2], walked.concat([2])),
                this.updateLODRecursively(observerPosition, observerDirection, tree[3], walked.concat([3])),
            ];
        } else {
            // if we are far from the node
            if (tree instanceof PlanetChunk) {
                let enableOcclusion = false;
                if (enableOcclusion) {
                    let rayDir = direction.normalize();
                    let [intersect, t0, t1] = rayIntersectSphere(observerPosition, rayDir, planetPosition, (this.rootChunkLength - 100e3 * 2 ** -tree.depth) / 2);
                    tree.mesh.setEnabled(!(intersect && t0 ** 2 < distanceToNodeSquared) && tree.isReady());
                }
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

    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @param isFiner
     * @returns The new Chunk
     */
    private createChunk(path: number[], isFiner: boolean): PlanetChunk {
        return new PlanetChunk(path, this.direction, this.chunkForge, this.planet, isFiner);
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