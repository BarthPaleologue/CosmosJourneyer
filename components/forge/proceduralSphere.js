import { ChunkForge } from "./chunkForge.js";
import { Direction } from "./direction.js";
import { PlanetSide } from "./planetSide.js";
export class ProceduralSphere {
    constructor(_id, _radius, position, nbSubdivisions, minDepth, maxDepth, scene) {
        this.sides = new Array(6); // stores the 6 sides of the sphere
        this.id = _id;
        this.radius = _radius;
        this.chunkLength = this.radius * 2;
        this.attachNode = BABYLON.Mesh.CreatePlane(`${this.id}AttachNode`, 1, scene);
        this.attachNode.position = position;
        this.surfaceMaterial = new BABYLON.ShaderMaterial(`${this.id}BaseMaterial`, scene, "");
        this.chunkForge = new ChunkForge(this.chunkLength, nbSubdivisions, scene);
        this.sides = [
            new PlanetSide(`${this.id}UpSide`, minDepth, maxDepth, this.chunkLength, nbSubdivisions, Direction.Up, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}DownSide`, minDepth, maxDepth, this.chunkLength, nbSubdivisions, Direction.Down, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}ForwardSide`, minDepth, maxDepth, this.chunkLength, nbSubdivisions, Direction.Forward, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}BackwardSide`, minDepth, maxDepth, this.chunkLength, nbSubdivisions, Direction.Backward, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}RightSide`, minDepth, maxDepth, this.chunkLength, nbSubdivisions, Direction.Right, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}LeftSide`, minDepth, maxDepth, this.chunkLength, nbSubdivisions, Direction.Left, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
        ];
    }
    /**
     * Sets the material used on the chunks
     * @param material
     */
    setChunkMaterial(material) {
        this.surfaceMaterial = material;
        for (let side of this.sides) {
            side.setChunkMaterial(material);
        }
    }
    /**
     * Update terrain of the sphere relative to the observer position
     * @param position the observer position
     */
    updateLOD(position, facingDirection) {
        for (let side of this.sides) {
            side.updateLOD(position, facingDirection);
        }
    }
    setRenderDistanceFactor(renderDistanceFactor) {
        for (let side of this.sides) {
            side.renderDistanceFactor = renderDistanceFactor;
        }
    }
    /**
     * Changes the maximum depth of the quadtrees
     * @param maxDepth the new maximum depth of the quadtrees
     */
    setMaxDepth(maxDepth) {
        for (let side of this.sides) {
            side.maxDepth = maxDepth;
        }
    }
    /**
     * Regenerates the chunks
     */
    reset() {
        for (let side of this.sides) {
            side.reset();
        }
    }
}
