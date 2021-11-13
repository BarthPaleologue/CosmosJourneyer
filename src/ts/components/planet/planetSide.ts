import { getChunkSphereSpacePositionFromPath, PlanetChunk } from "./planetChunk";
import { Direction } from "../toolbox/direction";
import { ChunkForge, TaskType } from "../forge/chunkForge";
import { Planet } from "./planet";
import { Vector3 } from "../toolbox/algebra";

type quadTree = quadTree[] | PlanetChunk;

/**
 * Un PlanetSide est un plan généré procéduralement qui peut être morph à volonté
 */
export class PlanetSide {
    // l'objet en lui même
    id: string; // un id unique

    // le quadtree
    minDepth: number;
    maxDepth: number; // profondeur maximale du quadtree envisagé
    tree: quadTree = []; // le quadtree en question
    renderDistanceFactor = 1;

    // les chunks
    chunkLength: number; // taille du côté de base
    baseSubdivisions: number = 16; // nombre de subdivisions
    direction: Direction; // direction de la normale au plan

    parent: BABYLON.Mesh; // objet parent des chunks
    scene: BABYLON.Scene; // scène dans laquelle instancier les chunks

    // Le CEO des chunks
    chunkForge: ChunkForge | undefined;

    surfaceMaterial: BABYLON.Material;

    planet: Planet;

    /**
     * 
     * @param id 
     * @param minDepth 
     * @param maxDepth 
     * @param chunkLength 
     * @param direction 
     * @param parentNode 
     * @param scene 
     * @param chunkForge 
     * @param surfaceMaterial 
     * @param planet 
     */
    constructor(id: string, minDepth: number, maxDepth: number, chunkLength: number, direction: Direction, parentNode: BABYLON.Mesh, scene: BABYLON.Scene, surfaceMaterial: BABYLON.Material, planet: Planet) {
        this.id = id;

        this.maxDepth = maxDepth;
        this.minDepth = minDepth;

        this.chunkLength = chunkLength;
        //this.baseSubdivisions = chunkForge.subdivisions;
        this.direction = direction;
        this.parent = parentNode;
        this.scene = scene;

        //this.chunkForge = chunkForge;

        this.surfaceMaterial = surfaceMaterial;

        this.planet = planet;
    }

    public setChunkForge(chunkForge: ChunkForge): void {
        this.chunkForge = chunkForge;
        this.baseSubdivisions = chunkForge.subdivisions;
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
                id: chunk.id,
                mesh: chunk.mesh,
            });
        }, tree);
    }

    /**
     * Update LOD of terrain relative to the observerPosition
     * @param observerPosition The observer position
     */
    public updateLOD(observerPosition: BABYLON.Vector3): void {
        this.tree = this.updateLODRecursively(observerPosition);
    }

    /**
     * Recursive function used internaly to update LOD
     * @param observerPosition The observer position
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    private updateLODRecursively(observerPosition: BABYLON.Vector3, tree: quadTree = this.tree, walked: number[] = []): quadTree {
        // position du noeud du quadtree par rapport à la sphère 
        let relativePosition = getChunkSphereSpacePositionFromPath(this.chunkLength, walked, this.direction, this.parent.rotation);

        // position par rapport à la caméra
        let parentPosition = new Vector3(this.parent.absolutePosition.x, this.parent.absolutePosition.y, this.parent.absolutePosition.z);
        let absolutePosition = relativePosition.addToNew(parentPosition);
        let direction = absolutePosition.subtractToNew(Vector3.FromBABYLON3(observerPosition));
        // distance carré entre caméra et noeud du quadtree
        let d2 = direction.getSquaredMagnitude();
        let limit = this.renderDistanceFactor * this.chunkLength / (2 ** walked.length);

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
                    this.updateLODRecursively(observerPosition, tree[0], walked.concat([0])),
                    this.updateLODRecursively(observerPosition, tree[1], walked.concat([1])),
                    this.updateLODRecursively(observerPosition, tree[2], walked.concat([2])),
                    this.updateLODRecursively(observerPosition, tree[3], walked.concat([3])),
                ];
            }
        } else {
            // si on est loin
            if (tree instanceof PlanetChunk) {
                //let camera = this.scene.activeCamera?.position;
                //let distanceToCenter = BABYLON.Vector3.DistanceSquared(observerPosition, this.parent.absolutePosition);
                // c'est pythagore
                //let behindHorizon = (d2 > distanceToCenter + (this.chunkLength / 2) ** 2);
                // un jour peut être de l'occlusion
                //tree.mesh.setEnabled(tree.mesh.isInFrustum(camera));

                let planetSpacePosition = Vector3.FromBABYLON3(observerPosition).subtractToNew(parentPosition);
                let dot = Vector3.Dot(planetSpacePosition.normalizeToNew(), relativePosition.normalizeToNew());

                let height01 = (planetSpacePosition.getMagnitude() - relativePosition.getMagnitude()) / relativePosition.getMagnitude();
                height01 = Math.min(height01, 1);
                //console.log(height01);
                tree.mesh.setEnabled(dot > -0.2);
                //tree.mesh.setEnabled(dot > 0.7 - height01); // on affiche que les chunk du côté du joueur
                // babylon fait déjà du frustrum culling apparemment.


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
    createChunk(path: number[]): PlanetChunk {
        if (this.chunkForge != undefined) {
            return new PlanetChunk(path, this.chunkLength, this.direction, this.parent, this.scene, this.chunkForge, this.surfaceMaterial, this.planet);
        } else {
            throw Error("Cannot create chunk when no ChunkForge is attached to the planet");
        }
    }

    /**
     * Sets the material for new chunks to the new material
     * @param material The new material to apply on new chunks
     */
    setChunkMaterial(material: BABYLON.Material): void {
        this.surfaceMaterial = material;
    }

    /**
     * Regenerate planet chunks
     */
    reset(): void {
        let newTree = this.createChunk([]);
        this.requestDeletion(this.tree);
        this.tree = newTree;
    }
}