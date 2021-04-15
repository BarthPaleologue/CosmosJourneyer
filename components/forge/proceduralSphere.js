import { ChunkForge } from "./chunkForge.js";
import { Direction } from "./direction.js";
import { PlanetSide } from "./planetSide.js";
export class ProceduralSphere {
    constructor(_id, _radius, position, nbSubdivisions, maxDepth, scene) {
        this.sides = new Array(6); // stores the 6 sides of the sphere
        this.id = _id;
        this.radius = _radius;
        this.chunkLength = this.radius * 2;
        this.attachNode = BABYLON.Mesh.CreatePlane(`${this.id}AttachNode`, 1, scene);
        this.attachNode.position = position;
        this.chunkForge = new ChunkForge(this.chunkLength, nbSubdivisions, scene);
        this.sides = [
            new PlanetSide(`${this.id}UpSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Up, this.attachNode, scene, this.chunkForge),
            new PlanetSide(`${this.id}DownSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Down, this.attachNode, scene, this.chunkForge),
            new PlanetSide(`${this.id}ForwardSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Forward, this.attachNode, scene, this.chunkForge),
            new PlanetSide(`${this.id}BackwardSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Backward, this.attachNode, scene, this.chunkForge),
            new PlanetSide(`${this.id}RightSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Right, this.attachNode, scene, this.chunkForge),
            new PlanetSide(`${this.id}LeftSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Left, this.attachNode, scene, this.chunkForge),
        ];
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
    /**
     * Regenerates the chunks
     */
    reset() {
        for (let side of this.sides) {
            side.reset();
        }
    }
}
