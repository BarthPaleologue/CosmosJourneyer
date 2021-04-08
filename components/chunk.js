import { ProceduralEngine } from "../engine/proceduralEngine.js";
export class Chunk {
    constructor(_path, _baseLength, _baseSubdivisions, _parentPosition, _parentRotation, scene) {
        this.baseLength = 10;
        this.baseSubdivisions = 20;
        this.x = 0;
        this.y = 0;
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
                this.x -= this.baseLength / 4 / (Math.pow(2, i));
                this.y -= this.baseLength / 4 / (Math.pow(2, i));
            }
            else if (this.path[i] == 1) {
                this.x += this.baseLength / 4 / (Math.pow(2, i));
                this.y -= this.baseLength / 4 / (Math.pow(2, i));
            }
            else if (this.path[i] == 2) {
                this.x += this.baseLength / 4 / (Math.pow(2, i));
                this.y += this.baseLength / 4 / (Math.pow(2, i));
            }
            else if (this.path[i] == 3) {
                this.x -= this.baseLength / 4 / (Math.pow(2, i));
                this.y += this.baseLength / 4 / (Math.pow(2, i));
            }
        }
        this.position = new BABYLON.Vector3(this.x, this.y, 0).add(this.parentPosition);
        this.mesh = ProceduralEngine.createPlane(this.baseLength / (Math.pow(2, this.depth)), this.baseSubdivisions, this.position, scene);
        this.mesh.rotation = this.parentRotation;
        let mat = new BABYLON.StandardMaterial(`mat${this.path}`, scene);
        mat.wireframe = true;
        mat.diffuseColor = BABYLON.Color3.Random();
        this.mesh.material = mat;
    }
}
