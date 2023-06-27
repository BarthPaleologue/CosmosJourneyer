import { PlanetChunk } from "./planetChunk";
import { Direction } from "../utils/direction";
import { ChunkForge } from "./chunkForge";
import { BuildTask, DeleteTask, TaskType } from "./taskTypes";
import { Settings } from "../settings";
import { getChunkSphereSpacePositionFromPath } from "../utils/chunkUtils";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { TerrainSettings } from "../terrain/terrainSettings";
import { UberScene } from "../uberCore/uberScene";
import { Assets } from "../assets";
import { TelluricPlanemoModel } from "../models/planemos/telluricPlanemoModel";
import { Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

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
    private readonly scene: UberScene;

    readonly planetName: string;
    readonly planetSeed: number;
    readonly terrainSettings: TerrainSettings;

    readonly parent: BasicTransform;

    readonly material: Material;

    /**
     *
     * @param direction
     * @param planetName
     * @param planetModel
     * @param parent
     * @param material
     * @param scene
     */
    constructor(direction: Direction, planetName: string, planetModel: TelluricPlanemoModel, parent: BasicTransform, material: Material, scene: UberScene) {
        this.rootChunkLength = planetModel.radius * 2;
        this.planetName = planetName;
        this.planetSeed = planetModel.seed;
        this.terrainSettings = planetModel.terrainSettings;

        this.minDepth = 0; //Math.max(Math.round(Math.log2(this.rootChunkLength / 2) - 19), 0);
        this.maxDepth = Math.max(Math.round(Math.log2(this.rootChunkLength / 2) - 12), 0);
        //let spaceBetweenVertex = this.rootChunkLength / (64 * 2 ** this.maxDepth);
        //console.log(spaceBetweenVertex);

        this.scene = scene;

        this.chunkForge = Assets.ChunkForge;

        this.direction = direction;

        this.parent = parent;

        this.material = material;
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
            const deleteTask: DeleteTask = {
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
        const nodeRelativePosition = getChunkSphereSpacePositionFromPath(walked, this.direction, this.rootChunkLength / 2, this.parent.getRotationQuaternion());
        const nodePositionW = nodeRelativePosition.add(this.parent.getAbsolutePosition());

        const direction = nodePositionW.subtract(observerPositionW);
        const distanceToNodeSquared = direction.lengthSquared();

        const distanceThreshold = (Settings.CHUNK_RENDER_DISTANCE_MULTIPLIER * this.rootChunkLength) / 2 ** walked.length;

        if ((distanceToNodeSquared < distanceThreshold ** 2 && walked.length < this.maxDepth) || walked.length < this.minDepth) {
            // if the node is near the camera or if we are loading minimal LOD
            if (tree instanceof PlanetChunk) {
                if (!tree.isReady()) return tree;
                if (!tree.mesh.isVisible) return tree;

                // if view ray goes through planet then we don't need to load more chunks
                /*const direction = tree.mesh.getAbsolutePosition().subtract(observerPositionW);
                const rayDir = direction.normalizeToNew();

                const [intersect, t0, t1] = rayIntersectSphere(observerPositionW, rayDir, this.parent.getAbsolutePosition(), this.rootChunkLength / 2);
                if (intersect && t0 ** 2 > direction.lengthSquared()) return tree;*/

                const newTree = [
                    this.createChunk(walked.concat([0]), true),
                    this.createChunk(walked.concat([1]), true),
                    this.createChunk(walked.concat([2]), true),
                    this.createChunk(walked.concat([3]), true)
                ];
                this.requestDeletion(tree, newTree, true);
                return newTree;
            }
            return [
                this.updateLODRecursively(observerPositionW, tree[0], walked.concat([0])),
                this.updateLODRecursively(observerPositionW, tree[1], walked.concat([1])),
                this.updateLODRecursively(observerPositionW, tree[2], walked.concat([2])),
                this.updateLODRecursively(observerPositionW, tree[3], walked.concat([3]))
            ];
        } else {
            // if we are far from the node
            if (tree instanceof PlanetChunk) return tree;

            if (walked.length >= this.minDepth) {
                const newChunk = this.createChunk(walked, false);
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
        const chunk = new PlanetChunk(path, this.direction, this.parent, this.material, this.rootChunkLength, this.minDepth === path.length, this.scene);

        const buildTask: BuildTask = {
            type: TaskType.Build,
            planetName: this.planetName,
            planetSeed: this.planetSeed,
            planetDiameter: this.rootChunkLength,
            terrainSettings: this.terrainSettings,
            position: chunk.cubePosition,
            depth: path.length,
            direction: this.direction,
            chunk: chunk,
            isFiner: isFiner
        };

        this.chunkForge.addTask(buildTask);

        return chunk;
    }

    public computeCulling(cameraPosition: Vector3): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            if (!chunk.isReady()) return;

            chunk.mesh.setEnabled(true);
            chunk.transform.node.computeWorldMatrix(true);

            const distance = Vector3.Distance(cameraPosition, chunk.transform.getAbsolutePosition());
            const angularSize = (chunk.getBoundingRadius() * 2) / distance;

            const chunkIsTooSmall = angularSize / Settings.FOV < 0.002;

            chunk.mesh.setEnabled(!chunkIsTooSmall);
        });
    }

    /**
     * Regenerate planet chunks
     */
    public reset(): void {
        const newTree = this.createChunk([], true);
        this.requestDeletion(this.tree, [newTree], false);
        this.tree = newTree;
    }

    public dispose(): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            chunk.dispose();
        });
    }
}
