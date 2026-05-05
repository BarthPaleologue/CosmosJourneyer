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

import { assertUnreachable } from "@/utils/types";

import { getQuaternionFromFaceIndex, type FaceIndex } from "./faceIndex";

export type ChunkIndices = {
    readonly lod: number;
    readonly x: number;
    readonly y: number;
};

export function getChunkChildIndices(parent: ChunkIndices, childIndex: 0 | 1 | 2 | 3): ChunkIndices {
    /*
        3   2
          +
        0   1
    */
    switch (childIndex) {
        case 0:
            return { lod: parent.lod + 1, x: parent.x * 2, y: parent.y * 2 };
        case 1:
            return { lod: parent.lod + 1, x: parent.x * 2 + 1, y: parent.y * 2 };
        case 2:
            return { lod: parent.lod + 1, x: parent.x * 2 + 1, y: parent.y * 2 + 1 };
        case 3:
            return { lod: parent.lod + 1, x: parent.x * 2, y: parent.y * 2 + 1 };
        default:
            return assertUnreachable(childIndex);
    }
}

export function getChunkPlaneSpacePosition(rootChunkLength: number, index: ChunkIndices): Vector3 {
    const tileCount = 2 ** index.lod;
    const chunkSideLength = rootChunkLength / tileCount;

    return new Vector3(
        -rootChunkLength / 2 + (index.x + 0.5) * chunkSideLength,
        -rootChunkLength / 2 + (index.y + 0.5) * chunkSideLength,
        -rootChunkLength / 2,
    );
}

export function getChunkSphereSpacePosition(
    chunkIndices: ChunkIndices,
    faceIndex: FaceIndex,
    planetRadius: number,
    planetRotationQuaternion: Quaternion,
): Vector3 {
    const position = getChunkPlaneSpacePosition(2 * planetRadius, chunkIndices);

    const rotationQuaternion = getQuaternionFromFaceIndex(faceIndex);
    position.applyRotationQuaternionInPlace(rotationQuaternion);
    position.normalize().scaleInPlace(planetRadius);

    position.applyRotationQuaternionInPlace(planetRotationQuaternion);

    return position;
}
