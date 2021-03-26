import { generateProceduralPlane, createPolyhedron } from "./procedural.js";

export class Planet {
    diameter: number;
    subdivisions: number;
    mesh: BABYLON.Mesh;
    position: BABYLON.Vector3;
    scene: BABYLON.Scene;

    constructor(_size:number, _subdivisions:number, _position: BABYLON.Vector3, _scene: BABYLON.Scene) {
        this.diameter = _size;
        this.subdivisions = _subdivisions;

        this.mesh = new BABYLON.Mesh("planet", _scene);
        this.position = _position;
        
        this.scene = _scene;

        //this.generateCubeMesh();
    }

    generateCubeMesh() {
        let mat = new BABYLON.StandardMaterial("mat1", this.scene);
        mat.wireframe = true;

        let sides: BABYLON.Mesh[] = [];

        for(let i = 0; i < 6; i++) {
            let [vertices, faces] = generateProceduralPlane(this.diameter, this.subdivisions);
            let plane = createPolyhedron(vertices, faces, 1, this.scene);
            plane.material = mat;
            sides.push(plane);
        }

        sides[0].rotation.y = Math.PI;
        sides[0].position.z = this.diameter/2;

        sides[1].position.z = -this.diameter/2;

        sides[2].rotation.x = Math.PI/2;
        sides[2].position.y = this.diameter/2;

        sides[3].rotation.x = -Math.PI/2;
        sides[3].position.y = -this.diameter/2;

        sides[4].rotation.y = -Math.PI/2;
        sides[4].position.x = this.diameter/2;

        sides[5].rotation.y = Math.PI/2;
        sides[5].position.x = -this.diameter/2;

        this.mesh = BABYLON.Mesh.MergeMeshes(sides)!;
        this.mesh.position = this.position;

        //this.morphToSphere();
    }
    morphToSphere() {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!;
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)!;

        let newVertices: number[] = [];

        for(let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i+1], vertices[i+2]);

            position.normalize().scaleInPlace(this.diameter/2);
            
            newVertices.push(position.x, position.y, position.z);
        }

        BABYLON.VertexData.ComputeNormals(newVertices, indices, normals);

        let vertexData = new BABYLON.VertexData()
        vertexData.positions = newVertices;
        vertexData.normals = normals;
        vertexData.indices = indices;

        vertexData.applyToMesh(this.mesh, true);
    }
    morphToWiggles() {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!;
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)!;

        let newVertices: number[] = [];

        for(let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i+1], vertices[i+2]);

            position = position.scale(1 + 0.1 * Math.sin(3*position.y));
            
            newVertices.push(position.x, position.y, position.z);
        }

        BABYLON.VertexData.ComputeNormals(newVertices, indices, normals);

        let vertexData = new BABYLON.VertexData()
        vertexData.positions = newVertices;
        vertexData.normals = normals;
        vertexData.indices = indices;

        vertexData.applyToMesh(this.mesh, true);
    }
    toggleWireframe() {
        this.mesh.material!.wireframe = !this.mesh.material?.wireframe;
    }
}