import { getChunkSphereSpacePositionFromPath, PlanetChunk } from "./planetChunk";
import { Direction } from "../../../toolbox/direction";
import { ChunkForge, TaskType } from "../../../forge/chunkForge";
import { SolidPlanet } from "./solidPlanet";
import { Vector3 } from "../../../toolbox/algebra";

type quadTree = quadTree[] | PlanetChunk;

/**
 * Un PlanetSide est un plan généré procéduralement qui peut être morph à volonté
 */
export class PlanetSide {
    // l'objet en lui même
    private readonly id: string; // un id unique

    // le quadtree
    private readonly minDepth: number;
    private readonly maxDepth: number; // profondeur maximale du quadtree envisagé

    private tree: quadTree = []; // le quadtree en question

    // paramètre de debug
    renderDistanceFactor = 2;

    // les chunks
    private readonly rootChunkLength: number; // taille du côté de base

    private readonly direction: Direction; // direction de la normale au plan

    private readonly parent: BABYLON.Mesh; // objet parent des chunks

    private readonly scene: BABYLON.Scene; // scène dans laquelle instancier les chunks

    // Le CEO des chunks
    private chunkForge: ChunkForge | undefined;

    private readonly surfaceMaterial: BABYLON.Material;

    private readonly planet: SolidPlanet;

    /**
     * 
     * @param id 
     * @param minDepth 
     * @param maxDepth 
     * @param rootChunkLength 
     * @param direction 
     * @param parentNode 
     * @param scene 
     * @param chunkForge 
     * @param surfaceMaterial 
     * @param planet 
     */
    constructor(id: string, minDepth: number, maxDepth: number, rootChunkLength: number, direction: Direction, parentNode: BABYLON.Mesh, scene: BABYLON.Scene, surfaceMaterial: BABYLON.Material, planet: SolidPlanet) {
        this.id = id;

        this.maxDepth = maxDepth;
        this.minDepth = minDepth;

        this.rootChunkLength = rootChunkLength;

        this.direction = direction;
        this.parent = parentNode;
        this.scene = scene;

        this.surfaceMaterial = surfaceMaterial;

        this.planet = planet;
    }

    public setChunkForge(chunkForge: ChunkForge): void {
        this.chunkForge = chunkForge;
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
     */
    private requestDeletion(tree: quadTree): void {
        this.executeOnEveryChunk((chunk: PlanetChunk) => {
            this.chunkForge?.addTask({
                taskType: TaskType.Deletion,
                id: chunk.mesh.id,
                mesh: chunk.mesh,
            });
        }, tree);
    }

    /**
     * Update LOD of terrain relative to the observerPosition
     * @param observerPosition The observer position
     */
    public updateLOD(observerPosition: BABYLON.Vector3, observerDirection: BABYLON.Vector3): void {
        this.tree = this.updateLODRecursively(observerPosition, observerDirection);
    }

    /**
     * Recursive function used internaly to update LOD
     * @param observerPosition The observer position
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    private updateLODRecursively(observerPosition: BABYLON.Vector3, observerDirection: BABYLON.Vector3, tree: quadTree = this.tree, walked: number[] = []): quadTree {
        // position du noeud du quadtree par rapport à la sphère 
        let relativePosition = getChunkSphereSpacePositionFromPath(this.rootChunkLength, walked, this.direction, this.parent.rotationQuaternion!);

        // position par rapport à la caméra
        let parentPosition = new Vector3(this.parent.absolutePosition.x, this.parent.absolutePosition.y, this.parent.absolutePosition.z);
        let absolutePosition = relativePosition.add(parentPosition);
        let direction = absolutePosition.subtract(Vector3.FromBABYLON3(observerPosition));
        // distance carré entre caméra et noeud du quadtree
        let d2 = direction.getSquaredMagnitude();
        let limit = this.renderDistanceFactor * this.rootChunkLength / (2 ** walked.length);

        if ((d2 < limit ** 2 && walked.length < this.maxDepth) || walked.length < this.minDepth) {
            // si on est proche de la caméra ou si on doit le générer car LOD minimal
            if (tree instanceof PlanetChunk) {
                // si c'est un chunk, on le subdivise
                let newTree = [
                    this.createChunk(walked.concat([0])),
                    this.createChunk(walked.concat([1])),
                    this.createChunk(walked.concat([2])),
                    this.createChunk(walked.concat([3])),
                ];
                this.requestDeletion(tree);
                return newTree;
            } else {
                // si c'en est pas un, on continue
                return [
                    this.updateLODRecursively(observerPosition, observerDirection, tree[0], walked.concat([0])),
                    this.updateLODRecursively(observerPosition, observerDirection, tree[1], walked.concat([1])),
                    this.updateLODRecursively(observerPosition, observerDirection, tree[2], walked.concat([2])),
                    this.updateLODRecursively(observerPosition, observerDirection, tree[3], walked.concat([3])),
                ];
            }
        } else {
            // si on est loin
            if (tree instanceof PlanetChunk) {
                let dn = direction.normalize();
                let dot = Vector3.Dot(relativePosition.normalize(), dn);

                // sera d'occludé les chunks derrière la caméra
                //let dot2 = Vector3.Dot(absolutePosition.normalize(), Vector3.FromBABYLON3(observerDirection));
                // mais si un chunk est très proche, il sera toujours visible (on est proche donc le dot2 peut être négatif alors que le chunk est visible)
                //let c2 = dot2 > - 0.5 && absolutePosition.getMagnitude() > this.rootChunkLength / (2 ** (walked.length + 3));

                //TODO: faire un vrai truc qui marche => là je perd la main sur certains chunks...
                //tree.mesh.setEnabled(dot < 0.5);
                //tree.mesh.setEnabled(!tree.mesh.isOccluded);

                return tree;
            } else {
                // si c'est un noeud, on supprime tous les enfants, on remplace par un nouveau chunk
                if (walked.length >= this.minDepth) {
                    let newChunk = this.createChunk(walked);
                    this.requestDeletion(tree);
                    return newChunk;
                } else {
                    return tree;
                }
            }
        }
    }

    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @returns The new Chunk
     */
    private createChunk(path: number[]): PlanetChunk {
        if (this.chunkForge != undefined) {
            return new PlanetChunk(path, this.rootChunkLength, this.direction, this.parent, this.scene, this.chunkForge, this.surfaceMaterial, this.planet);
        } else {
            throw Error("Cannot create chunk when no ChunkForge is attached to the planet");
        }
    }

    /**
     * Regenerate planet chunks
     */
    public reset(): void {
        let newTree = this.createChunk([]);
        this.requestDeletion(this.tree);
        this.tree = newTree;
    }
}