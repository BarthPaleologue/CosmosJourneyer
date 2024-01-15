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
import { DeleteSemaphore } from "./deleteSemaphore";
import { UberScene } from "../../../../uberCore/uberScene";
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

    private deleteSemaphores: DeleteSemaphore[] = [];

    readonly planetModel: TelluricPlanemoModel;

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
        this.deleteSemaphores.push(new DeleteSemaphore(newChunks, chunksToDelete));
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
        // remove zombie mutexes
        this.deleteSemaphores.forEach((mutex) => mutex.resolveIfZombie());
        // remove delete mutexes that have been resolved
        this.deleteSemaphores = this.deleteSemaphores.filter((mutex) => !mutex.isResolved());

        this.tree = this.updateLODRecursively(observerPosition, chunkForge);
    }

    private getAverageHeight(tree: quadTree): number {
        if (tree instanceof PlanetChunk) return tree.getAverageHeight();
        else if (tree.length > 0) return 0.25 * (this.getAverageHeight(tree[0]) + this.getAverageHeight(tree[1]) + this.getAverageHeight(tree[2]) + this.getAverageHeight(tree[3]));
        else return 0;
    }

    private getMinAverageHeight(tree: quadTree): number {
        if (tree instanceof PlanetChunk) return tree.getAverageHeight();
        else if (tree.length > 0)
            return Math.min(this.getMinAverageHeight(tree[0]), this.getMinAverageHeight(tree[1]), this.getMinAverageHeight(tree[2]), this.getMinAverageHeight(tree[3]));
        else return 0;
    }

    private getMaxAverageHeight(tree: quadTree): number {
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
    private updateLODRecursively(observerPositionW: Vector3, chunkForge: ChunkForge, tree: quadTree = this.tree, walked: number[] = []): quadTree {
        if (walked.length == this.maxDepth) return tree;

        const nodeRelativePosition = getChunkSphereSpacePositionFromPath(walked, this.direction, this.rootChunkLength / 2, getRotationQuaternion(this.parent));
        const nodePositionW = nodeRelativePosition.add(this.parent.getAbsolutePosition());

        const direction = nodePositionW.subtract(this.parent.getAbsolutePosition()).normalize();
        const additionalHeight = this.getAverageHeight(tree);
        const chunkApproxPosition = nodePositionW.add(direction.scale(additionalHeight));
        const distanceToNodeSquared = Vector3.DistanceSquared(chunkApproxPosition, observerPositionW);

        const subdivisionDistanceThreshold = Settings.CHUNK_RENDER_DISTANCE_MULTIPLIER * (this.rootChunkLength / 2 ** walked.length);
        const deletionDistanceThreshold = 10e3 + Settings.CHUNK_RENDER_DISTANCE_MULTIPLIER * (this.rootChunkLength / 2 ** (walked.length - 1));

        // the 1.5 is to avoid creation/deletion oscillations
        if (distanceToNodeSquared > deletionDistanceThreshold ** 2 && walked.length >= this.minDepth && tree instanceof Array) {
            const newChunk = this.createChunk(walked, chunkForge);
            if (tree.length === 0 && walked.length === 0) {
                return newChunk;
            }
            this.requestDeletion(tree, [newChunk]);
            return newChunk;
        }

        if (tree instanceof Array) {
            return [
                this.updateLODRecursively(observerPositionW, chunkForge, tree[0], walked.concat([0])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[1], walked.concat([1])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[2], walked.concat([2])),
                this.updateLODRecursively(observerPositionW, chunkForge, tree[3], walked.concat([3]))
            ];
        }

        if (distanceToNodeSquared < subdivisionDistanceThreshold ** 2 || walked.length < this.minDepth) {
            if (tree instanceof PlanetChunk) {
                if (!tree.isReady()) return tree;
                if (!tree.mesh.isVisible) return tree;
            }

            const newTree = [
                this.createChunk(walked.concat([0]), chunkForge),
                this.createChunk(walked.concat([1]), chunkForge),
                this.createChunk(walked.concat([2]), chunkForge),
                this.createChunk(walked.concat([3]), chunkForge)
            ];
            this.requestDeletion(tree, newTree);
            return newTree;
        }

        if (tree instanceof PlanetChunk) return tree;

        throw new Error("This should never happen");
    }

    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @param chunkForge
     * @returns The new Chunk
     */
    private createChunk(path: number[], chunkForge: ChunkForge): PlanetChunk {
        const chunk = new PlanetChunk(path, this.direction, this.parentAggregate, this.material, this.planetModel, this.rootChunkLength, this.scene);

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
        for (const deleteSemaphore of this.deleteSemaphores) {
            for (const chunk of deleteSemaphore.chunksToDelete) {
                chunk.registerPhysicsShapeDeletion(index);
            }
        }
    }

    public computeCulling(camera: Camera): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            chunk.computeCulling(camera);
        });
    }

    public dispose(): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            chunk.dispose();
        });
        for (const mutex of this.deleteSemaphores) {
            for (const chunk of mutex.chunksToDelete) {
                chunk.dispose();
            }
        }
    }
}
