import { ProceduralEngine } from "../engine/proceduralEngine.js";

export class Chunk {
    path: number[];
    baseLength = 10;
    baseSubdivisions = 20;
    depth: number;
    x = 0;
    y = 0;
    parentPosition: BABYLON.Vector3;
    parentRotation: BABYLON.Vector3;
    position: BABYLON.Vector3;
    mesh: BABYLON.Mesh;

    constructor(_path: number[], _baseLength: number, _baseSubdivisions: number, _parentPosition: BABYLON.Vector3, _parentRotation: BABYLON.Vector3, scene: BABYLON.Scene) {
        this.path = _path;
        this.baseLength = _baseLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.depth = this.path.length;
        this.parentPosition = _parentPosition;
        this.parentRotation = _parentRotation;

        for (let i = 0; i < this.depth; i++) {
            /*
                3   2
                  +
                0   1
            */
            if (this.path[i] == 0) {
                this.x -= this.baseLength / 4 / (2 ** i);
                this.y -= this.baseLength / 4 / (2 ** i);
            } else if (this.path[i] == 1) {
                this.x += this.baseLength / 4 / (2 ** i);
                this.y -= this.baseLength / 4 / (2 ** i);
            } else if (this.path[i] == 2) {
                this.x += this.baseLength / 4 / (2 ** i);
                this.y += this.baseLength / 4 / (2 ** i);
            } else if (this.path[i] == 3) {
                this.x -= this.baseLength / 4 / (2 ** i);
                this.y += this.baseLength / 4 / (2 ** i);
            }
        }

        this.position = new BABYLON.Vector3(this.x, this.y, 0).add(this.parentPosition);

        this.mesh = ProceduralEngine.createPlane(this.baseLength / (2 ** this.depth), this.baseSubdivisions, this.position, scene);
        this.mesh.rotation = this.parentRotation;

        let mat = new BABYLON.StandardMaterial(`mat${this.path}`, scene);
        mat.wireframe = true;
        mat.diffuseColor = BABYLON.Color3.Random();
        this.mesh.material = mat;
    }
}