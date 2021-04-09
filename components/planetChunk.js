import { ProceduralEngine } from "../engine/proceduralEngine.js";
export class PlanetChunk {
    constructor(_path, _baseLength, _baseSubdivisions, _direction, _parentNode, scene, _terrainFunction) {
        this.x = 0;
        this.y = 0;
        this.path = _path;
        this.baseLength = _baseLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.depth = this.path.length;
        this.direction = _direction;
        this.parentNode = _parentNode;
        this.terrainFunction = _terrainFunction;
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
        this.position = new BABYLON.Vector3(this.x, this.y, -this.baseLength / 2);
        let [mesh, position] = ProceduralEngine.createSphereChunk(this.baseLength, this.baseLength / (Math.pow(2, this.depth)), this.baseSubdivisions, BABYLON.Vector3.Zero(), this.position, this.direction, scene, this.terrainFunction);
        this.mesh = mesh;
        this.mesh.parent = this.parentNode;
        this.position = this.position.add(position);
        //let test = BABYLON.Mesh.CreateBox(this.path.toString(), 1 / this.depth, scene);
        //test.position = position;
        let mat = new BABYLON.StandardMaterial(`mat${this.path}`, scene);
        //mat.wireframe = true;
        //mat.emissiveColor = BABYLON.Color3.Random();
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.08);
        this.mesh.material = mat;
    }
}
