import {Quaternion, Vector3, Mesh} from "@babylonjs/core";

import {SolidPlanet} from "./solidPlanet";
import {ChunkForge} from "../../../forge/chunkForge";
import {BuildTask, TaskType} from "../../../forge/taskInterfaces";
import {Direction, getQuaternionFromDirection} from "../../../utils/direction";
import {Algebra} from "../../../utils/algebra";

/**
 * Returns the node position in plane space
 * @param chunkLength the length of a chunk
 * @param path the path of the node
 * @returns the plane space coordinates of the chunk
 */
export function getChunkPlaneSpacePositionFromPath(chunkLength: number, path: number[]): Vector3 {
    let x = 0;
    let y = 0;
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
 * @param planetRotationQuaternion
 * @returns the position in planet space
 */
export function getChunkSphereSpacePositionFromPath(chunkLength: number, path: number[], direction: Direction, planetRotationQuaternion: Quaternion): Vector3 {

    // on récupère la position dans le plan
    let position = getChunkPlaneSpacePositionFromPath(chunkLength, path);

    // on l'offset pour préparer à récupérer la position dans le cube
    position.addInPlace(new Vector3(0, 0, -chunkLength / 2));

    let rotationQuaternion = getQuaternionFromDirection(direction);
    Algebra.applyQuaternionInPlace(rotationQuaternion, position);

    // on projette cette position sur la sphère
    Algebra.normalizeInPlace(position);
    position.scaleInPlace(chunkLength / 2);

    // on match cette position avec la rotation de la planète
    Algebra.applyQuaternionInPlace(planetRotationQuaternion, position);

    // c'est prêt !
    return position;
}

// ne pas supprimer la classe pour cause de peut être des arbres et de l'herbe
export class PlanetChunk {

    public readonly mesh: Mesh;

    public readonly depth: number;

    private ready = false;

    constructor(path: number[], direction: Direction, chunkForge: ChunkForge, planet: SolidPlanet, isFiner: boolean) {
        let id = `D${direction}P${path.join("")}`;

        // computing the position of the chunk on the side of the planet
        let position = getChunkPlaneSpacePositionFromPath(planet.rootChunkLength, path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        position.z -= planet.rootChunkLength / 2;

        this.depth = path.length;

        this.mesh = new Mesh(`Chunk${id}`, planet.attachNode.getScene());
        this.mesh.setEnabled(false);

        this.mesh.material = planet.surfaceMaterial;

        this.mesh.parent = planet.attachNode;

        // revoir les paramètres passés dans la taches => trouver les dénos communs

        let buildTask: BuildTask = {
            taskType: TaskType.Build,
            planet: planet,
            position: position,
            depth: path.length,
            direction: direction,
            chunk: this,
            isFiner: isFiner
        }

        chunkForge.addTask(buildTask);

        // sphérisation du cube
        // note : on sphérise après car le worker script calcule les positions à partir du cube
        Algebra.normalizeInPlace(position);
        position.scaleInPlace(planet.rootChunkLength / 2);

        this.mesh.position.x = position.x;
        this.mesh.position.y = position.y;
        this.mesh.position.z = position.z;
    }

    public isReady() {
        return this.ready;
    }

    public markAsReady() {
        this.ready = true;
        this.mesh.setEnabled(true);
    }

    public markAsNotReady() {
        this.ready = false;
        this.mesh.setEnabled(false);
    }

    public dispose() {
        this.mesh.dispose();
    }
}