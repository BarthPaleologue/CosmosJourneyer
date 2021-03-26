import { generateProceduralPlane, createPolyhedron } from "./procedural.js";
export class Planet {
    constructor(_size, _subdivisions, _scene) {
        this.diameter = _size;
        this.subdivisions = _subdivisions;
        this.mesh = new BABYLON.Mesh("planet", _scene);
        this.scene = _scene;
        this.generateMesh();
    }
    generateMesh() {
        let [vertices, faces] = generateProceduralPlane(this.diameter, this.subdivisions);
        this.mesh = createPolyhedron(vertices, faces, this.diameter, this.scene);
        let mat = new BABYLON.StandardMaterial("mat1", this.scene);
        mat.wireframe = true;
        this.mesh.material = mat;
    }
}
