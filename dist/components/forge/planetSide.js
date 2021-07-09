import { getChunkSphereSpacePositionFromPath, PlanetChunk } from "./planetChunk.js";
import { TaskType } from "./chunkForge.js";
/**
 * Un PlanetSide est un plan généré procéduralement qui peut être morph à volonté
 */
export class PlanetSide {
    /**
     *
     * @param _id
     * @param _minDepth
     * @param _maxDepth
     * @param _chunkLength
     * @param _direction
     * @param _parentNode
     * @param _scene
     * @param _chunkForge
     * @param _surfaceMaterial
     * @param _planet
     */
    constructor(_id, _minDepth, _maxDepth, _chunkLength, _direction, _parentNode, _scene, _chunkForge, _surfaceMaterial, _planet) {
        this.renderDistanceFactor = 3;
        this.id = _id;
        this.maxDepth = _maxDepth;
        this.minDepth = _minDepth;
        this.chunkLength = _chunkLength;
        this.baseSubdivisions = _chunkForge.subdivisions;
        this.direction = _direction;
        this.parent = _parentNode;
        this.scene = _scene;
        this.chunkForge = _chunkForge;
        this.surfaceMaterial = _surfaceMaterial;
        this.planet = _planet;
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
        // position du noeud du quadtree par rapport à la sphère 
        let relativePosition = getChunkSphereSpacePositionFromPath(this.chunkLength, walked, this.direction);
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationX(this.parent.rotation.x));
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationY(this.parent.rotation.y));
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationZ(this.parent.rotation.z));
        // position par rapport à la caméra
        let absolutePosition = relativePosition.add(this.parent.absolutePosition);
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
        return new PlanetChunk(path, this.chunkLength, this.direction, this.parent, this.scene, this.chunkForge, this.surfaceMaterial, this.planet);
    }
    setChunkMaterial(material) {
        this.surfaceMaterial = material;
    }
    /**
     * Regenerate planet chunks
     */
    reset() {
        let newTree = this.createChunk([]);
        this.requestDeletion(this.tree);
        this.tree = newTree;
    }
}
