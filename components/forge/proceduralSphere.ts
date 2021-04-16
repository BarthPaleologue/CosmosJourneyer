import { ChunkForge } from "./chunkForge.js";
import { Direction } from "./direction.js";
import { PlanetSide } from "./planetSide.js";

export class ProceduralSphere {
    id: string; // unique id
    radius: number; // radius of sphere
    chunkLength: number; // length of eachChunk

    attachNode: BABYLON.Mesh; // reprensents the center of the sphere
    sides: PlanetSide[] = new Array(6); // stores the 6 sides of the sphere

    chunkForge: ChunkForge; // le CEO du terrain, tout simplement

    surfaceMaterial: BABYLON.ShaderMaterial;

    constructor(_id: string, _radius: number, position: BABYLON.Vector3, nbSubdivisions: number, maxDepth: number, scene: BABYLON.Scene) {
        this.id = _id;
        this.radius = _radius;
        this.chunkLength = this.radius * 2;

        this.attachNode = BABYLON.Mesh.CreatePlane(`${this.id}AttachNode`, 1, scene);
        this.attachNode.position = position;

        this.surfaceMaterial = new BABYLON.ShaderMaterial(`${this.id}BaseMaterial`, scene, "");

        this.chunkForge = new ChunkForge(this.chunkLength, nbSubdivisions, scene);

        this.sides = [
            new PlanetSide(`${this.id}UpSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Up, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}DownSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Down, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}ForwardSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Forward, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}BackwardSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Backward, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}RightSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Right, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}LeftSide`, maxDepth, this.chunkLength, nbSubdivisions, Direction.Left, this.attachNode, scene, this.chunkForge, this.surfaceMaterial),
        ];
    }

    /**
     * Sets the material used on the chunks
     * @param material 
     */
    setChunkMaterial(material: BABYLON.ShaderMaterial) {
        this.surfaceMaterial = material;
        for (let side of this.sides) {
            side.setChunkMaterial(material);
        }
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param position the observer position
     */
    updateLOD(position: BABYLON.Vector3, facingDirection: BABYLON.Vector3) {
        for (let side of this.sides) {
            side.updateLOD(position, facingDirection);
        }
    }

    setRenderDistanceFactor(renderDistanceFactor: number) {
        for (let side of this.sides) {
            side.renderDistanceFactor = renderDistanceFactor;
        }
    }

    /**
     * Changes the maximum depth of the quadtrees
     * @param maxDepth the new maximum depth of the quadtrees
     */
    setMaxDepth(maxDepth: number) {
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