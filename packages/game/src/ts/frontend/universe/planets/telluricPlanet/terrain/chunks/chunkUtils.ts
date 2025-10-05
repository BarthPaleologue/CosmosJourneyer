//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3, type Quaternion } from "@babylonjs/core/Maths/math.vector";

import { getQuaternionFromDirection, type Direction } from "./direction";

/**
 * Returns the node position in plane space
 * @param chunkLength the length of a chunk
 * @param path the path of the node
 * @returns the plane space coordinates of the chunk
 */
export function getChunkPlaneSpacePositionFromPath(chunkLength: number, path: number[]): Vector3 {
    let x = 0;
    let y = 0;
    for (const [i, pathValue] of path.entries()) {
        /*
            3   2
              +
            0   1
        */
        // offset to get to the center of the children from the center of the current chunk
        // (chunkLength / 2) / (2 ** (i + 1)) est la moitié de la taille d'un chunk enfant (offset) donc on simplifie pas : c'est plus clair ainsi
        switch (pathValue) {
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
                throw new Error(`${pathValue} is not a valid index for a child of a quadtree node !`);
        }
    }
    return new Vector3(x, y, 0);
}

/**
 * Returns chunk position in planet space
 * @param path the path to the chunk in the quadtree
 * @param direction direction of the parent plane
 * @param planetRadius
 * @param planetRotationQuaternion
 * @returns the position in planet space
 */
export function getChunkSphereSpacePositionFromPath(
    path: number[],
    direction: Direction,
    planetRadius: number,
    planetRotationQuaternion: Quaternion,
): Vector3 {
    // on récupère la position dans le plan
    const position = getChunkPlaneSpacePositionFromPath(2 * planetRadius, path);

    // on l'offset pour préparer à récupérer la position dans le cube
    position.addInPlace(new Vector3(0, 0, -planetRadius));

    const rotationQuaternion = getQuaternionFromDirection(direction);
    position.applyRotationQuaternionInPlace(rotationQuaternion);

    // on projette cette position sur la sphère
    position.normalize().scaleInPlace(planetRadius);

    // on match cette position avec la rotation de la planète
    position.applyRotationQuaternionInPlace(planetRotationQuaternion);

    return position;
}
