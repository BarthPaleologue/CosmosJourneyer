import { PlanetChunk } from "./planetChunk";
import { Direction } from "../../../../utils/direction";
import { ChunkForge } from "./chunkForge";
import { BuildTask, TaskType } from "./taskTypes";
import { Settings } from "../../../../settings";
import { getChunkSphereSpacePositionFromPath } from "../../../../utils/chunkUtils";
import { TerrainSettings } from "../terrainSettings";
import { TelluricPlanemoModel } from "../../telluricPlanemoModel";
import { Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { isSizeOnScreenEnough } from "../../../../utils/isObjectVisibleOnScreen";
import { Observable } from "@babylonjs/core/Misc/observable";
import { DeleteMutex } from "./deleteMutex";
import { UberScene } from "../../../../uberCore/uberScene";
import { Assets } from "../../../../assets";
import { getRotationQuaternion } from "../../../../uberCore/transforms/basicTransform";

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

    private readonly scene: UberScene;

    private deleteMutexes: DeleteMutex[] = [];

    readonly planetName: string;
    readonly planetSeed: number;
    readonly terrainSettings: TerrainSettings;

    readonly parent: TransformNode;
    readonly parentAggregate: PhysicsAggregate;

    readonly onChunkPhysicsShapeDeletedObservable = new Observable<number>();

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
    constructor(direction: Direction, planetName: string, planetModel: TelluricPlanemoModel, parentAggregate: PhysicsAggregate, material: Material, scene: UberScene) {
        this.rootChunkLength = planetModel.radius * 2;
        this.planetName = planetName;
        this.planetSeed = planetModel.seed;
        this.terrainSettings = planetModel.terrainSettings;

        this.minDepth = 0;

        // max depth is minimal depth to get a certain minimum space between vertices
        this.maxDepth = Math.ceil(Math.log2(this.rootChunkLength / (Settings.MIN_DISTANCE_BETWEEN_VERTICES * Settings.VERTEX_RESOLUTION)));
        console.log(this.maxDepth);

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
    public executeOnEveryChunk(f: (chunk: PlanetChunk) => void, tree: quadTree = this.tree): void {
        if (tree instanceof PlanetChunk) f(tree);
        else for (const stem of tree) this.executeOnEveryChunk(f, stem);
    }

    /**
     * Creates deletion mutexes for the tree (we will delete the chunks only when the new ones are ready)
     * @param tree The tree to delete
     * @param newChunks
     */
    private requestDeletion(tree: quadTree, newChunks: PlanetChunk[]): void {
        const chunksToDelete = this.getChunkList(tree);
        this.deleteMutexes.push(new DeleteMutex(newChunks, chunksToDelete));
    }

    public getChunkList(tree: quadTree): PlanetChunk[] {
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
        // remove delete mutexes that have been resolved
        /*const deleteMutexes: DeleteMutex[] = [];
    for (const deleteMutex of this.deleteMutexes) {
        if (!deleteMutex.isResolved()) deleteMutexes.push(deleteMutex);
    }
    this.deleteMutexes = deleteMutexes;
*/
        this.tree = this.updateLODRecursively(observerPosition, chunkForge);
    }

    /**
     * Recursive function used internaly to update LOD
     * @param observerPositionW The observer position in world space
     * @param chunkForge
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    private updateLODRecursively(observerPositionW: Vector3, chunkForge: ChunkForge, tree: quadTree = this.tree, walked: number[] = []): quadTree {
        const nodeRelativePosition = getChunkSphereSpacePositionFromPath(walked, this.direction, this.rootChunkLength / 2, getRotationQuaternion(this.parent));
        const nodePositionW = nodeRelativePosition.add(this.parent.getAbsolutePosition());

        const direction = nodePositionW.subtract(observerPositionW).normalizeToNew();
        const chunkApproxPosition = nodePositionW;//.add(direction.scale(this.terrainSettings.max_mountain_height + this.terrainSettings.continent_base_height + this.terrainSettings.max_bump_height));
        const distanceToNodeSquared = chunkApproxPosition.subtract(observerPositionW).lengthSquared();

        const distanceThreshold = Settings.CHUNK_RENDER_DISTANCE_MULTIPLIER * (this.rootChunkLength / 2 ** walked.length);

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
                    this.createChunk(walked.concat([0]), chunkForge),
                    this.createChunk(walked.concat([1]), chunkForge),
                    this.createChunk(walked.concat([2]), chunkForge),
                    this.createChunk(walked.concat([3]), chunkForge)
                ];
                this.requestDeletion(tree, newTree);
                return newTree;
            }
            return [
                this.updateLODRecursively(observerPositionW, chunkForge, tree[0], walked.concat([0])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[1], walked.concat([1])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[2], walked.concat([2])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[3], walked.concat([3]))
            ];
        } else {
            // if we are far from the node
            if (tree instanceof PlanetChunk) return tree;

            if (walked.length >= this.minDepth) {
                const newChunk = this.createChunk(walked, chunkForge);
                this.requestDeletion(tree, [newChunk]);
                return newChunk;
            }
            return tree;
        }
    }

    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @returns The new Chunk
     */
    private createChunk(path: number[], chunkForge: ChunkForge): PlanetChunk {
        const chunk = new PlanetChunk(path, this.direction, this.parentAggregate, this.material, this.rootChunkLength, this.scene);

        chunk.onDestroyPhysicsShapeObservable.add((index) => {
            this.onChunkPhysicsShapeDeletedObservable.notifyObservers(index);
        });

        const buildTask: BuildTask = {
            type: TaskType.Build,
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

    public registerPhysicsShapeDeletion(index: number): void {
        this.executeOnEveryChunk((chunk) => {
            chunk.registerPhysicsShapeDeletion(index);
        });
        for (const mutex of this.deleteMutexes) {
            for (const chunk of mutex.chunksToDelete) {
                chunk.registerPhysicsShapeDeletion(index);
            }
        }
    }

    public computeCulling(camera: Camera): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            if (!chunk.isReady()) return;

            chunk.mesh.setEnabled(true); // this is needed to update the world matrix
            chunk.getTransform().computeWorldMatrix(true);

            chunk.mesh.setEnabled(isSizeOnScreenEnough(chunk, camera));
        });
    }

    public dispose(): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            chunk.dispose();
        });
        for (const mutex of this.deleteMutexes) {
            for (const chunk of mutex.chunksToDelete) {
                chunk.dispose();
            }
        }
    }
}
