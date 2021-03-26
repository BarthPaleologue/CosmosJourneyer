import { generateProceduralPlane, createPolyhedron } from "./procedural.js";

export class Planet {
    diameter: number;
    subdivisions: number;
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    constructor(_size:number, _subdivisions:number, _scene: BABYLON.Scene) {
        this.diameter = _size;
        this.subdivisions = _subdivisions;

        this.mesh = new BABYLON.Mesh("planet", _scene);
        
        this.scene = _scene;

        this.generateMesh();
    }
    generateMesh() {
        let mat = new BABYLON.StandardMaterial("mat1", this.scene);
        mat.wireframe = true;

        let sides: BABYLON.Mesh[] = [];

        for(let i = 0; i < 6; i++) {
            let [vertices, faces] = generateProceduralPlane(this.diameter, this.subdivisions);
            let plane = createPolyhedron(vertices, faces, 1, this.scene);
            plane.material = mat;
            sides.push(plane);
        }

        sides[0].position.z = this.diameter;

        sides[1].position.z = -this.diameter;

        sides[2].rotation.x = Math.PI/2;
        sides[2].position.y = this.diameter;

        sides[3].rotation.x = Math.PI/2;
        sides[3].position.y = -this.diameter;

        sides[4].rotation.y = Math.PI/2;
        sides[4].position.x = this.diameter;

        sides[5].rotation.y = Math.PI/2;
        sides[5].position.x = -this.diameter;

        /*let [vertices1, faces1] = generateProceduralPlane(this.diameter, this.subdivisions);
        let plane1 = createPolyhedron(vertices1, faces1, this.diameter, this.scene);
        plane1.material = mat;
        plane1.position.z = this.diameter*2;

        let [vertices2, faces2] = generateProceduralPlane(this.diameter, this.subdivisions);
        let plane2 = createPolyhedron(vertices2, faces2, this.diameter, this.scene);
        plane2.material = mat;
        plane2.position.z = -this.diameter*2;*/
    }
}