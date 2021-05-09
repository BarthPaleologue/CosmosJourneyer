import { getChunkSphereSpacePositionFromPath, PlanetChunk } from "./planetChunk.js";
import { TaskType } from "./chunkForge.js";
/**
 * Un PlanetSide est un plan généré procéduralement qui peut être morph à volonté
 */
export class PlanetSide {
    constructor(_id, _minDepth, _maxDepth, _chunkLength, _baseSubdivisions, _direction, _parentNode, _scene, _chunkForge, _surfaceMaterial) {
        this.renderDistanceFactor = 3;
        this.id = _id;
        this.maxDepth = _maxDepth;
        this.minDepth = _minDepth;
        this.chunkLength = _chunkLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.direction = _direction;
        this.parent = _parentNode;
        this.scene = _scene;
        this.chunkForge = _chunkForge;
        this.surfaceMaterial = _surfaceMaterial;
        // on initialise le plan avec un unique chunk
        this.tree = this.createChunk([]);
    }
    /**
     * Function used to execute code on every chunk of the quadtree
     * @param tree the tree to explore
     * @param f the function to apply on every chunk
     */
    executeOnEveryChunk(f, tree = this.tree) {
        if (tree instanceof PlanetChunk) {
            f(tree);
        }
        else {
            for (let stem of tree)
                this.executeOnEveryChunk(f, stem);
        }
    }
    /**
     * Send deletion request to chunkforge regarding the chunks of a branch
     * @param tree The tree to delete
     */
    requestDeletion(tree) {
        this.executeOnEveryChunk((chunk) => {
            this.chunkForge.addTask({
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
    updateLOD(observerPosition, facingDirection) {
        this.tree = this.updateLODRecursively(observerPosition, facingDirection);
    }
    /**
     * Recursive function used internaly to update LOD
     * @param observerPosition The observer position
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    updateLODRecursively(observerPosition, facingDirection, tree = this.tree, walked = []) {
        // position par rapport à la sphère du noeud du quadtree
        let relativePosition = getChunkSphereSpacePositionFromPath(this.chunkLength, walked, this.direction);
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationX(this.parent.rotation.x));
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationY(this.parent.rotation.y));
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationZ(this.parent.rotation.z));
        // position par rapport à la caméra
        let absolutePosition = relativePosition.add(this.parent.position);
        let direction = absolutePosition.subtract(observerPosition);
        let dot = BABYLON.Vector3.Dot(direction, facingDirection);
        // distance carré entre caméra et noeud du quadtree
        let d = direction.lengthSquared();
        let limit = this.renderDistanceFactor * (this.chunkLength / (Math.pow(2, walked.length)));
        if ((d < Math.pow(limit, 2) && walked.length < this.maxDepth) || walked.length < this.minDepth) {
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
            }
            else {
                // si c'en est pas un, on continue
                return [
                    this.updateLODRecursively(observerPosition, facingDirection, tree[0], walked.concat([0])),
                    this.updateLODRecursively(observerPosition, facingDirection, tree[1], walked.concat([1])),
                    this.updateLODRecursively(observerPosition, facingDirection, tree[2], walked.concat([2])),
                    this.updateLODRecursively(observerPosition, facingDirection, tree[3], walked.concat([3])),
                ];
            }
        }
        else {
            // si on est loin
            if (tree instanceof PlanetChunk) {
                //let camera = this.scene.activeCamera?.position;
                let distanceToCenter = BABYLON.Vector3.DistanceSquared(observerPosition, this.parent.absolutePosition);
                // c'est pythagore
                let behindHorizon = (d > distanceToCenter + Math.pow((this.chunkLength / 2), 2));
                //tree.mesh.setEnabled(!behindHorizon);
                return tree;
            }
            else {
                // si c'est un noeud, on supprime tous les enfants, on remplace par un nouveau chunk
                if (walked.length > this.minDepth) {
                    let newChunk = this.createChunk(walked);
                    this.requestDeletion(tree);
                    return newChunk;
                }
                else {
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
    createChunk(path) {
        return new PlanetChunk(path, this.chunkLength, this.baseSubdivisions, this.direction, this.parent, this.scene, this.chunkForge, this.surfaceMaterial);
    }
    setChunkMaterial(material) {
        this.surfaceMaterial = material;
    }
    reset() {
        let newTree = this.createChunk([]);
        this.requestDeletion(this.tree);
        this.tree = newTree;
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
