import { ChunkForge, TaskType } from "./chunkForge.js";
import { Direction } from "./direction.js";

export function getChunkPlaneSpacePositionFromPath(baseLength: number, path: number[]): BABYLON.Vector3 {
    let [x, y] = [0, 0];
    for (let i = 0; i < path.length; i++) {
        /*
            3   2
              +
            0   1
        */
        switch (path[i]) {
            case 0:
                x -= baseLength / 4 / (2 ** i);
                y -= baseLength / 4 / (2 ** i);
                break;
            case 1:
                x += baseLength / 4 / (2 ** i);
                y -= baseLength / 4 / (2 ** i);
                break;
            case 2:
                x += baseLength / 4 / (2 ** i);
                y += baseLength / 4 / (2 ** i);
                break;
            case 3:
                x -= baseLength / 4 / (2 ** i);
                y += baseLength / 4 / (2 ** i);
                break;
        }
    }
    return new BABYLON.Vector3(x, y, 0);
}

export function getChunkSphereSpacePositionFromPath(baseLength: number, path: number[], direction: Direction) {
    let position = getChunkPlaneSpacePositionFromPath(baseLength, path);
    position.addInPlace(new BABYLON.Vector3(0, 0, -baseLength / 2));

    position = position.normalizeToNew().scale(baseLength);

    let rotation = BABYLON.Matrix.Identity();
    switch (direction) {
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

    return BABYLON.Vector3.TransformCoordinates(position, rotation);

}

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

        this.position = getChunkPlaneSpacePositionFromPath(this.baseLength, this.path);
        this.position.addInPlace(new BABYLON.Vector3(0, 0, -this.baseLength / 2));

        this.mesh = new BABYLON.Mesh(`Chunk${this.id}`, scene);

        this.chunkForge.addTask({
            taskType: TaskType.Creation,
            id: this.id,
            parentNode: this.parentNode,
            position: this.position,
            depth: this.depth,
            direction: this.direction
        });

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

        this.position = BABYLON.Vector3.TransformCoordinates(this.position, rotation);

        let mat = new BABYLON.StandardMaterial(`mat${this.path}`, scene);
        //mat.wireframe = true;
        //mat.emissiveColor = BABYLON.Color3.Random();
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.08);
        mat.specularColor = new BABYLON.Color3(1, 1, 1).scale(0.1);
        this.mesh.material = mat;

    }
}