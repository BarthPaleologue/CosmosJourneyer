import { ProceduralEngine } from "../engine/proceduralEngine.js";
const baseLength = 10;
const baseSubdivisions = 20;
export class Chunk {
    constructor(_path, scene) {
        this.offsetX = 0;
        this.offsetY = 0;
        this.path = _path;
        this.depth = this.path.length;
        this.mesh = ProceduralEngine.createCorneredPlane(baseLength / (Math.pow(2, (this.depth - 1))), baseSubdivisions, scene);
        for (let i = 0; i < this.depth; i++) {
            /*
                3   2
                0   1
            */
            if (this.path[i] == 1) {
                this.offsetX += baseLength / Math.pow(2, i);
            }
            else if (this.path[i] == 2) {
                this.offsetX += baseLength / Math.pow(2, i);
                this.offsetY += baseLength / Math.pow(2, i);
            }
            else if (this.path[i] == 3) {
                this.offsetY += baseLength / Math.pow(2, i);
            }
        }
        this.mesh.position.x = this.offsetX;
        this.mesh.position.y = this.offsetY;
    }
}
