import { ChunkForge } from "./chunkForge.js";
import { Direction } from "./direction.js";
import { PlanetSide } from "./planetSide.js";

export class ProceduralSphere {
    id: string;
    radius: number;
    position: BABYLON.Vector3;
    nbSubdivisions: number;
    maxDepth: number;
    scene: BABYLON.Scene;

    attachNode: BABYLON.Mesh;
    sides: PlanetSide[];

    chunkForge: ChunkForge;

    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _maxDepth: number, _scene: BABYLON.Scene) {
        this.id = _id;
        this.radius = _radius;
        this.position = _position;
        this.nbSubdivisions = _nbSubdivisions;
        this.maxDepth = _maxDepth;
        this.scene = _scene;

        this.attachNode = BABYLON.Mesh.CreatePlane(`${this.id}AttachNode`, 1, this.scene);
        this.attachNode.position = this.position;

        this.chunkForge = new ChunkForge(this.radius, this.nbSubdivisions, this.scene);

        this.sides = [
            new PlanetSide("upSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Up, this.attachNode, this.scene, this.chunkForge),
            new PlanetSide("downSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Down, this.attachNode, this.scene, this.chunkForge),
            new PlanetSide("forwardSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Forward, this.attachNode, this.scene, this.chunkForge),
            new PlanetSide("backwardSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Backward, this.attachNode, this.scene, this.chunkForge),
            new PlanetSide("rightSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Right, this.attachNode, this.scene, this.chunkForge),
            new PlanetSide("leftSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Left, this.attachNode, this.scene, this.chunkForge),
        ];
    }

    updateLOD(position: BABYLON.Vector3) {
        for (let side of this.sides) {
            side.updateLOD(position);
        }
    }
}