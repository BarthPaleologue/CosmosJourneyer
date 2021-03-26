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
        mat.pointsCloud = false;
        mat.pointSize = 2;
        mat.wireframe = false;

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

        for(let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i+1], vertices[i+2]);

            position.normalize().scaleInPlace(this.diameter/2);
            
            vertices[i] = position.x;
            vertices[i + 1] = position.y;
            vertices[i + 2] = position.z;
        }

        BABYLON.VertexData.ComputeNormals(vertices, indices, normals);

        let vertexData = new BABYLON.VertexData()
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;

        vertexData.applyToMesh(this.mesh, true);
    }

    morphToWiggles(freq: number, amp: number) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!;
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)!;

        for(let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i+1], vertices[i+2]);


            position = position.scale(1 + amp * Math.sin(freq * position.y));
            
            vertices[i] = position.x;
            vertices[i + 1] = position.y;
            vertices[i + 2] = position.z;
        }

        BABYLON.VertexData.ComputeNormals(vertices, indices, normals);

        let vertexData = new BABYLON.VertexData()
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;

        vertexData.applyToMesh(this.mesh, true);
    }

    addCrater(faceIndex:number) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!;
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)!;

        let faceStart = faceIndex * vertices.length / 6; // index du premier inclus
        //let faceEnd = ((faceIndex+1) * vertices.length / 6); // index du dernier inclus

        //console.log((faceEnd - faceStart)/3, (this.subdivisions+1)**2);

        let radius = Math.random() * this.subdivisions / 8;

        let xCrater = Math.random() * (this.subdivisions - radius);
        let yCrater = Math.random() * (this.subdivisions - radius);

        // le +1 viens du fait que y a pour n+1 vertices pour n carrés de subdivisions
        for(let x = 0; x < this.subdivisions + 1; x++) {
            for(let y = 0; y < this.subdivisions + 1; y++) {
                let indexOffset = faceStart + 3 * (x * (this.subdivisions + 1) + y); // on commence au début de la face, et on ajoute le triple de case visitées (tableau déplié)
                
                let position = new BABYLON.Vector3(vertices[indexOffset], vertices[indexOffset + 1], vertices[indexOffset + 2]);
                
                let squaredDistanceToCrater = (x - xCrater) ** 2 + (y - yCrater) ** 2;

                if(squaredDistanceToCrater <= radius ** 2) {
                    position = position.scale(0.95 + (squaredDistanceToCrater/100)**2)
                    //position = position.scale(1 + 0.1 * Math.sin(10 * position.y));
                }

                /*if(x > xCrater && x < xCrater + radius && y > yCrater && y < yCrater + radius) {
                    position = position.scale(1 + 0.1 * Math.sin(10 * position.y));
                }*/
                
                vertices[indexOffset] = position.x;
                vertices[indexOffset + 1] = position.y;
                vertices[indexOffset + 2] = position.z;
            }
        }

        BABYLON.VertexData.ComputeNormals(vertices, indices, normals);

        let vertexData = new BABYLON.VertexData()
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;

        vertexData.applyToMesh(this.mesh, true);
    }

    toggleWireframe() {
        this.mesh.material!.wireframe = !this.mesh.material?.wireframe;
    }

    togglePointsCloud() {
        this.mesh.material!.pointsCloud = !this.mesh.material?.pointsCloud;
    }
}