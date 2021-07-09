import { Planet } from "../planet.js";
import { ChunkForge, TaskType } from "./chunkForge.js";
import { Direction } from "./direction.js";

/**
 * Returns the chunk position in plane space
 * @param chunkLength the length of a chunk
 * @param path the path of the chunk
 * @returns the plane coordinates of the chunk
 */
export function getChunkPlaneSpacePositionFromPath(chunkLength: number, path: number[]): BABYLON.Vector3 {
    let [x, y] = [0, 0];
    for (let i = 0; i < path.length; i++) {
        /*
            3   2
              +
            0   1
        */
        // i have no idea why i divide by four but it works heh
        switch (path[i]) {
            case 0:
                x -= chunkLength / 4 / (2 ** i);
                y -= chunkLength / 4 / (2 ** i);
                break;
            case 1:
                x += chunkLength / 4 / (2 ** i);
                y -= chunkLength / 4 / (2 ** i);
                break;
            case 2:
                x += chunkLength / 4 / (2 ** i);
                y += chunkLength / 4 / (2 ** i);
                break;
            case 3:
                x -= chunkLength / 4 / (2 ** i);
                y += chunkLength / 4 / (2 ** i);
                break;
        }
    }
    return new BABYLON.Vector3(x, y, 0);
}

/**
 * Returns chunk position in sphere space (doesn't account for rotation of the planet yet tho)
 * @param chunkLength the length of the chunk
 * @param path the path to the chunk in the quadtree
 * @param direction direction of the parent plane
 * @returns the position in sphere space (no planet rotation)
 */
export function getChunkSphereSpacePositionFromPath(chunkLength: number, path: number[], direction: Direction) {
    let position = getChunkPlaneSpacePositionFromPath(chunkLength, path);
    position.addInPlace(new BABYLON.Vector3(0, 0, -chunkLength / 2));

    position = position.normalizeToNew().scale(chunkLength / 2);

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
    id: string; // identifiant unique du chunk
    path: number[]; // chemin menant au chunk dans son quadtree

    // données géométriques du chunk
    chunkLength;
    baseSubdivisions;
    depth: number;
    direction: Direction;
    mesh: BABYLON.Mesh;

    // coordonnées sur le plan
    x = 0;
    y = 0;

    parentNode: BABYLON.Mesh; // point d'attache planétaire
    position: BABYLON.Vector3; // position dans l'espace de la sphère (rotation non prise en compte)

    constructor(_path: number[], _chunkLength: number, _baseSubdivisions: number, _direction: Direction, _parentNode: BABYLON.Mesh, scene: BABYLON.Scene, chunkForge: ChunkForge, surfaceMaterial: BABYLON.Material, planet: Planet) {
        this.id = `[D${_direction}][P${_path.join("")}]`;
        this.path = _path;
        this.chunkLength = _chunkLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.depth = this.path.length;
        this.direction = _direction;
        this.parentNode = _parentNode;

        this.position = getChunkPlaneSpacePositionFromPath(this.chunkLength, this.path);
        this.position.addInPlace(new BABYLON.Vector3(0, 0, -this.chunkLength / 2));

        this.mesh = new BABYLON.Mesh(`Chunk${this.id}`, scene);
        this.mesh.material = surfaceMaterial;
        //this.mesh.material.wireframe = true;
        this.mesh.parent = this.parentNode;

        chunkForge.addTask({
            taskType: TaskType.Build,
            id: this.id,
            planet: planet,
            position: this.position,
            chunkLength: this.chunkLength,
            depth: this.depth,
            direction: this.direction,
            mesh: this.mesh,
        });

        this.position = this.position.normalizeToNew().scale(this.chunkLength / 2);

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

        //console.log(surfaceMaterial);

        //this.mesh.material = surfaceMaterial;

    }
}