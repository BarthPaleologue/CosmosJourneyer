import { ProceduralEngine } from "../engine/proceduralEngine.js";

const baseLength = 10;
const baseSubdivisions = 20;

export class Chunk {
    path: number[];
    depth: number;
    offsetX = 0;
    offsetY = 0;
    mesh: BABYLON.Mesh;

    constructor(_path: number[], scene: BABYLON.Scene) {
        this.path = _path;
        this.depth = this.path.length;
        this.mesh = ProceduralEngine.createCorneredPlane(baseLength / (2 ** (this.depth - 1)), baseSubdivisions, scene);
        this.mesh.material = scene.getMaterialByID("inactiveMat");
        for (let i = 0; i < this.depth; i++) {
            /*
                3   2
                0   1
            */
            if (this.path[i] == 1) {
                this.offsetX += baseLength / 2 ** i;
            } else if (this.path[i] == 2) {
                this.offsetX += baseLength / 2 ** i;
                this.offsetY += baseLength / 2 ** i;
            } else if (this.path[i] == 3) {
                this.offsetY += baseLength / 2 ** i;
            }
        }
        this.mesh.position.x = this.offsetX;
        this.mesh.position.y = this.offsetY;
    }
}