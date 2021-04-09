import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { Direction } from "./direction.js";

export class PlanetChunk {
    path: number[];
    baseLength;
    baseSubdivisions;
    depth: number;
    x = 0;
    y = 0;
    direction: Direction;
    parentNode: BABYLON.Mesh;
    position: BABYLON.Vector3;
    mesh: BABYLON.Mesh;
    terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3;
    constructor(_path: number[], _baseLength: number, _baseSubdivisions: number, _direction: Direction, _parentNode: BABYLON.Mesh, scene: BABYLON.Scene, _terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3) {
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

        this.position = new BABYLON.Vector3(this.x, this.y, -this.baseLength / 2);

        let [mesh, position] = ProceduralEngine.createSphereChunk(this.baseLength, this.baseLength / (2 ** this.depth), this.baseSubdivisions, BABYLON.Vector3.Zero(), this.position, this.direction, scene, this.terrainFunction);
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

    /*morph(morphFunction: (p: BABYLON.Vector3) => BABYLON.Vector3) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!;
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)!;

        for (let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);

            position = morphFunction(position);

            vertices[i] = position.x;
            vertices[i + 1] = position.y;
            vertices[i + 2] = position.z;
        }

        BABYLON.VertexData.ComputeNormals(vertices, indices, normals);

        let vertexData = new BABYLON.VertexData();
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;

        vertexData.applyToMesh(this.mesh, true);
    }*/
}