import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { ChunkForge, TaskType } from "./chunkForge.js";
import { Direction } from "./direction.js";

export class PlanetChunk {
    id: string;
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
    chunkForge: ChunkForge;

    constructor(_path: number[], _baseLength: number, _baseSubdivisions: number, _direction: Direction, _parentNode: BABYLON.Mesh, scene: BABYLON.Scene, _chunkForge: ChunkForge) {
        this.id = `[D:${_direction}][P:${_path}]`;
        this.path = _path;
        this.baseLength = _baseLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.depth = this.path.length;
        this.direction = _direction;
        this.parentNode = _parentNode;

        this.chunkForge = _chunkForge;

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

        this.mesh = new BABYLON.Mesh(`Chunk${this.id}`, scene);

        //console.log(`Chunk${this.id}`);

        this.chunkForge.addTask({
            taskType: TaskType.Creation,
            id: this.id,
            parentNode: this.parentNode,
            position: this.position,
            depth: this.depth,
            direction: this.direction
        });

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

        let positionVector = BABYLON.Vector3.Zero();
        positionVector = positionVector.add(this.position);
        positionVector = BABYLON.Vector3.TransformCoordinates(positionVector, rotation);
        positionVector = positionVector.normalizeToNew().scale(this.baseLength);

        this.position = positionVector; //this.position.add(positionVector);

        let mat = new BABYLON.StandardMaterial(`mat${this.path}`, scene);
        //mat.wireframe = true;
        //mat.emissiveColor = BABYLON.Color3.Random();
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.08);
        mat.specularColor = new BABYLON.Color3(1, 1, 1).scale(0.1);
        this.mesh.material = mat;

    }
}