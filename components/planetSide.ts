import { getChunkSphereSpacePositionFromPath, PlanetChunk } from "./planetChunk.js";
import { Direction } from "./direction.js";
import { ChunkForge, TaskType } from "./chunkForge.js";

type quadTree = quadTree[] | PlanetChunk;

/**
 * Un PlanetSide est un plan généré procéduralement qui peut être morph à volonté
 */
export class PlanetSide {
    // l'objet en lui même
    id: string; // un id unique

    // le quadtree
    maxDepth: number; // profondeur maximale du quadtree envisagé
    tree: quadTree; // le quadtree en question

    // les chunks
    baseLength: number; // taille du côté de base
    baseSubdivisions: number; // nombre de subdivisions
    direction: Direction; // direction de la normale au plan
    parent: BABYLON.Mesh; // objet parent des chunks
    scene: BABYLON.Scene; // scène dans laquelle instancier les chunks

    // Le CEO des chunks
    chunkForge: ChunkForge;

    constructor(_id: string, _maxDepth: number, _baseLength: number, _baseSubdivisions: number, _direction: Direction, _parentNode: BABYLON.Mesh, _scene: BABYLON.Scene, _chunkForge: ChunkForge) {
        this.id = _id;

        this.maxDepth = _maxDepth;

        this.baseLength = _baseLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.direction = _direction;
        this.parent = _parentNode;
        this.scene = _scene;

        this.chunkForge = _chunkForge;

        // on initialise le plan avec un unique chunk
        this.tree = this.createChunk([]);
    }

    /**
     * Function used to execute code on every chunk of the quadtree
     * @param tree the tree to explore
     * @param f the function to apply on every chunk
     */
    public executeOnEveryChunk(f: (chunk: PlanetChunk) => void, tree: quadTree = this.tree) {
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
            this.chunkForge.addTask({
                taskType: TaskType.Deletion,
                id: chunk.id,
                parentNode: chunk.parentNode,
                position: chunk.position,
                depth: chunk.depth,
                direction: chunk.direction
            });
        }, tree);
    }

    /**
     * Update LOD of terrain relative to the observerPosition
     * @param observerPosition The observer position
     */
    public updateLOD(observerPosition: BABYLON.Vector3) {
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
        // position par rapport à la sphère du noeud du quadtree
        let relativePosition = getChunkSphereSpacePositionFromPath(this.baseLength, walked, this.direction);
        // position par rapport à la caméra
        let absolutePosition = relativePosition.add(this.parent.position);
        // distance carré entre caméra et noeud du quadtree
        let d = BABYLON.Vector3.DistanceSquared(absolutePosition, observerPosition);

        if (d < 10 * (this.baseLength ** 2) / (2 ** walked.length) && walked.length < this.maxDepth) {
            // si on est proche de la caméra
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
                return tree;
            } else {
                // si c'est un noeud, on supprime tous les enfants, on remplace par un nouveau chunk
                let newChunk = this.createChunk(walked);
                this.requestDeletion(tree);
                return newChunk;
            }
        }
    }

    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @returns The new Chunk
     */
    createChunk(path: number[]): PlanetChunk {
        return new PlanetChunk(path, this.baseLength, this.baseSubdivisions, this.direction, this.parent, this.scene, this.chunkForge);
    }
}



/**
 * The function used to add a subdivision at the specified path
 * @param tree The tree to explore
 * @param path The path leading to the new subdivision
 * @param walked The location of the current root relative to the absolute root
 * @returns The updated tree
 */
/*public addBranch(path: number[], tree: quadTree = this.tree, walked: number[] = []): quadTree {
    if (tree instanceof PlanetChunk) {
        // si c'est un chunk
        if (path.length == 0) {
            // si on est au bon endroit dans l'arbre on ajoute la branche
            let newBranch = [
                this.createChunk(walked.concat([0])),
                this.createChunk(walked.concat([1])),
                this.createChunk(walked.concat([2])),
                this.createChunk(walked.concat([3]))
            ];
            this.requestDeletion(tree);
            return newBranch;
        } else {
            // si on est pas encore arrivé, on crée une branche intermédiaire et on continue
            let newTree: quadTree = [
                this.createChunk(walked.concat([0])),
                this.createChunk(walked.concat([1])),
                this.createChunk(walked.concat([2])),
                this.createChunk(walked.concat([3]))
            ];
            let next = path.shift()!;
            newTree[next] = this.addBranch(path, newTree[next], walked.concat([next]));
            this.requestDeletion(tree);
            return newTree;
        }
    } else {
        // si c'est pas un chunk
        if (path.length == 0) {
            // si on est arrivé : il y a déjà une subdivision donc on fait rien
            return tree;
        } else {
            // sinon on ajoute une branche pour continuer le chemin et on continue
            let next = path.shift()!;
            tree[next] = this.addBranch(path, tree[next], walked.concat([next]));

            return tree;
        }
    }
}*/

/**
 * The function used to remove a subdivision at the specified path
 * @param tree The tree to explore
 * @param path The path leading to the subdivision to remove
 * @param walked The location of the current root relative to the absolute root
 * @returns The updated tree
 */
/*public deleteBranch(path: number[], tree: quadTree = this.tree, walked: number[] = []): quadTree {
    if (tree instanceof PlanetChunk) {
        return tree;
    } else {
        if (path.length == 0) {
            // si on est arrivé et que il y a une branche d'attachée au noeud : on coupe la branche et on remplace par un chunk
            let replacement = this.createChunk(walked);
            this.requestDeletion(tree);
            return replacement;
        } else {
            let next = path.shift()!;
            tree[next] = this.deleteBranch(path, tree[next], walked.concat([next]));
            return tree;
        }
    }
}*/