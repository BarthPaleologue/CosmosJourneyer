import { Planet } from "./planet";
import { ChunkForge, TaskType } from "../forge/chunkForge";
import { Direction, getRotationMatrixFromDirection } from "../toolbox/direction";
import { Matrix3, Vector3 } from "../toolbox/algebra";

/**
 * Returns the node position in plane space
 * @param chunkLength the length of a chunk
 * @param path the path of the node
 * @returns the plane space coordinates of the chunk
 */
export function getChunkPlaneSpacePositionFromPath(chunkLength: number, path: number[]): Vector3 {
    let [x, y] = [0, 0];
    for (let i = 0; i < path.length; ++i) {
        /*
            3   2
              +
            0   1
        */
        // offset to get to the center of the children from the center of the current chunk
        // (chunkLength / 2) / (2 ** (i + 1)) est la moitié de la taille d'un chunk enfant (offset) donc on simplifie pas : c'est plus clair ainsi
        switch (path[i]) {
            case 0:
                x -= (chunkLength / 2) / (2 ** (i + 1));
                y -= (chunkLength / 2) / (2 ** (i + 1));
                break;
            case 1:
                x += (chunkLength / 2) / (2 ** (i + 1));
                y -= (chunkLength / 2) / (2 ** (i + 1));
                break;
            case 2:
                x += (chunkLength / 2) / (2 ** (i + 1));
                y += (chunkLength / 2) / (2 ** (i + 1));
                break;
            case 3:
                x -= (chunkLength / 2) / (2 ** (i + 1));
                y += (chunkLength / 2) / (2 ** (i + 1));
                break;
            default:
                throw new Error(`${path[i]} is not a valid index for a child of a quadtree node !`);
        }
    }
    return new Vector3(x, y, 0);
}

/**
 * Returns chunk position in planet space
 * @param chunkLength the length of the chunk
 * @param path the path to the chunk in the quadtree
 * @param direction direction of the parent plane
 * @returns the position in planet space
 */
export function getChunkSphereSpacePositionFromPath(chunkLength: number, path: number[], direction: Direction, parentRotation: BABYLON.Vector3): Vector3 {

    // on récupère la position dans le plan
    let position = getChunkPlaneSpacePositionFromPath(chunkLength, path);

    // on l'offset pour préparer à récupérer la position dans le cube
    position.addInPlace(new Vector3(0, 0, -chunkLength / 2));

    // on récupère la position dans le cube
    let rotationMatrix = getRotationMatrixFromDirection(direction);
    position = position.applyMatrixToNew(rotationMatrix);

    // on projette cette position sur la sphère
    position = position.normalizeToNew().scaleToNew(chunkLength / 2);

    // on match cette position avec la rotation de la planète
    position = position.applyMatrixToNew(Matrix3.RotationX(parentRotation.x));
    position = position.applyMatrixToNew(Matrix3.RotationY(parentRotation.y));
    position = position.applyMatrixToNew(Matrix3.RotationZ(parentRotation.z));

    // c'est prêt !
    return position;
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

    constructor(_path: number[], _chunkLength: number, _direction: Direction, _parentNode: BABYLON.Mesh, scene: BABYLON.Scene, chunkForge: ChunkForge, surfaceMaterial: BABYLON.Material, planet: Planet) {
        this.id = `[D${_direction}][P${_path.join("")}]`;
        this.path = _path;
        this.chunkLength = _chunkLength;
        this.baseSubdivisions = chunkForge.subdivisions;
        this.depth = this.path.length;
        this.direction = _direction;
        this.parentNode = _parentNode;

        let position = getChunkPlaneSpacePositionFromPath(this.chunkLength, this.path);

        this.position = new BABYLON.Vector3(position.x, position.y, position.z);

        this.position.addInPlace(new BABYLON.Vector3(0, 0, -this.chunkLength / 2));

        this.mesh = new BABYLON.Mesh(`Chunk${this.id}`, scene);
        this.mesh.material = surfaceMaterial;

        /*let debugMaterial = new BABYLON.StandardMaterial("debug", scene);
        debugMaterial.emissiveColor = BABYLON.Color3.Random();
        debugMaterial.specularColor = BABYLON.Color3.Black();
        debugMaterial.diffuseColor = BABYLON.Color3.Black();
        debugMaterial.backFaceCulling = false;
        debugMaterial.useLogarithmicDepth = true;
        debugMaterial.wireframe = true;*/

        //this.mesh.material = debugMaterial;

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

        // prise en compte de la rotation de la planète notamment
        this.position = this.position.normalizeToNew().scale(this.chunkLength / 2);

        this.mesh.position = this.position;

    }
}