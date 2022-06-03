import { Vector3 } from "@babylonjs/core";
import { Direction, getQuaternionFromDirection } from "./direction";
import { SolidPlanet } from "../celestialBodies/planets/solidPlanet";

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
                x -= chunkLength / 2 / 2 ** (i + 1);
                y -= chunkLength / 2 / 2 ** (i + 1);
                break;
            case 1:
                x += chunkLength / 2 / 2 ** (i + 1);
                y -= chunkLength / 2 / 2 ** (i + 1);
                break;
            case 2:
                x += chunkLength / 2 / 2 ** (i + 1);
                y += chunkLength / 2 / 2 ** (i + 1);
                break;
            case 3:
                x -= chunkLength / 2 / 2 ** (i + 1);
                y += chunkLength / 2 / 2 ** (i + 1);
                break;
            default:
                throw new Error(`${path[i]} is not a valid index for a child of a quadtree node !`);
        }
    }
    return new Vector3(x, y, 0);
}

/**
 * Returns chunk position in planet space
 * @param path the path to the chunk in the quadtree
 * @param direction direction of the parent plane
 * @param planet
 * @returns the position in planet space
 */
export function getChunkSphereSpacePositionFromPath(path: number[], direction: Direction, planet: SolidPlanet): Vector3 {
    // FIXME: fix documentation
    // on récupère la position dans le plan
    let position = getChunkPlaneSpacePositionFromPath(planet.getDiameter(), path);

    // on l'offset pour préparer à récupérer la position dans le cube
    position.addInPlace(new Vector3(0, 0, -planet.getRadius()));

    let rotationQuaternion = getQuaternionFromDirection(direction);
    position.applyRotationQuaternionInPlace(rotationQuaternion);

    // on projette cette position sur la sphère
    position.normalize();
    position.scaleInPlace(planet.getRadius());

    // on match cette position avec la rotation de la planète
    position.applyRotationQuaternionInPlace(planet.getRotationQuaternion());

    return position;
}
