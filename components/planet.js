import { Direction } from "./direction.js";
import { PlanetSide } from "./planetSide.js";
export class Planet {
    constructor(_id, _radius, _position, _nbSubdivisions, _maxDepth, _scene, _terrainFunction) {
        this.id = _id;
        this.radius = _radius;
        this.position = _position;
        this.nbSubdivisions = _nbSubdivisions;
        this.maxDepth = _maxDepth;
        this.terrainFunction = _terrainFunction;
        this.scene = _scene;
        this.attachNode = BABYLON.Mesh.CreatePlane(`${this.id}AttachNode`, 1, this.scene);
        this.attachNode.position = this.position;
        this.sides = [
            new PlanetSide("upSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Up, this.attachNode, this.scene, this.terrainFunction),
            new PlanetSide("downSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Down, this.attachNode, this.scene, this.terrainFunction),
            new PlanetSide("forwardSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Forward, this.attachNode, this.scene, this.terrainFunction),
            new PlanetSide("backwardSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Backward, this.attachNode, this.scene, this.terrainFunction),
            new PlanetSide("rightSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Right, this.attachNode, this.scene, this.terrainFunction),
            new PlanetSide("leftSide", this.maxDepth, this.radius, this.nbSubdivisions, Direction.Left, this.attachNode, this.scene, this.terrainFunction),
        ];
    }
    updateLOD(position) {
        for (let side of this.sides) {
            side.updateLOD(position);
        }
    }
}
