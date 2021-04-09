import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { Direction } from "./direction.js";



export class Chunk {
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

        this.position = new BABYLON.Vector3(this.x, this.y, 0).add(new BABYLON.Vector3(0, 0, -this.baseLength / 2));
        //this.position = new BABYLON.Vector3(this.x, this.y, -5).normalizeToNew().scale(10);



        this.mesh = ProceduralEngine.createPlane(this.baseLength / (2 ** this.depth), this.baseSubdivisions, BABYLON.Vector3.Zero(), scene);

        //this.mesh = ProceduralEngine.createPlane(this.baseLength / (2 ** this.depth), this.baseSubdivisions, BABYLON.Vector3.Zero(), scene);
        this.mesh.parent = this.parentNode;
        this.offsetPosition(this.position);

        // TIME TO BEND
        this.normalize(this.baseLength);
        this.position = this.position.normalizeToNew().scale(this.baseLength);

        let rotation = BABYLON.Matrix.Identity();

        switch (this.direction) {
            case Direction.Up:
                rotation = BABYLON.Matrix.RotationX(Math.PI / 2);
                break;
            case Direction.Down:
                rotation = BABYLON.Matrix.RotationX(-Math.PI / 2);
                break;
            case Direction.Forward:
                rotation = BABYLON.Matrix.Identity();
                break;
            case Direction.Backward:
                rotation = BABYLON.Matrix.RotationY(Math.PI);
                break;
            case Direction.Left:
                rotation = BABYLON.Matrix.RotationY(-Math.PI / 2);
                break;
            case Direction.Right:
                rotation = BABYLON.Matrix.RotationY(Math.PI / 2);
                break;
        }

        // rotate the chunk in planet space
        this.position = BABYLON.Vector3.TransformCoordinates(this.position, rotation);
        this.morph((p: BABYLON.Vector3) => {
            return BABYLON.Vector3.TransformCoordinates(p, rotation);
        });

        // terrain generation
        this.morph(this.terrainFunction);

        let mat = new BABYLON.StandardMaterial(`mat${this.path}`, scene);
        //mat.wireframe = true;
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.08);
        this.mesh.material = mat;

    }


    normalize(scale: number) {
        this.morph((position: BABYLON.Vector3) => {
            return position.normalizeToNew().scale(scale);
        });
    }

    offsetPosition(offset: BABYLON.Vector3) {
        this.morph((position: BABYLON.Vector3) => {
            return position.add(offset);
        });
    }

    morph(morphFunction: (p: BABYLON.Vector3) => BABYLON.Vector3) {
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
    }
}