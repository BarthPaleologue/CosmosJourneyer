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

import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";

export function downSample(matrixBuffer: Float32Array, stride: number): Float32Array {
    const nbMatrices = Math.floor(matrixBuffer.length / 16);
    const wantedNbMatrices = Math.floor(nbMatrices / stride);
    const downSampledBuffer = new Float32Array(16 * wantedNbMatrices);
    for (let i = 0; i < wantedNbMatrices; i++) {
        const index = i * stride * 16;
        downSampledBuffer.set(matrixBuffer.subarray(index, index + 16), i * 16);
    }
    return downSampledBuffer;
}

export function randomDownSample(matrixBuffer: Float32Array, stride: number): Float32Array {
    const nbMatrices = Math.floor(matrixBuffer.length / 16);
    const wantedNbMatrices = Math.floor(nbMatrices / stride);
    const downSampledBuffer = new Float32Array(16 * wantedNbMatrices);
    for (let i = 0; i < wantedNbMatrices; i++) {
        const index = Math.floor(Math.random() * nbMatrices) * 16;
        downSampledBuffer.set(matrixBuffer.subarray(index, index + 16), i * 16);
    }
    return downSampledBuffer;
}

export function createSquareMatrixBuffer(position: Vector3, size: number, resolution: number, rng: () => number) {
    const matrixBuffer = new Float32Array(resolution * resolution * 16);
    const cellSize = size / resolution;
    let index = 0;
    for (let x = 0; x < resolution; x++) {
        for (let z = 0; z < resolution; z++) {
            const randomCellPositionX = rng() * cellSize;
            const randomCellPositionZ = rng() * cellSize;
            const positionX = position.x + x * cellSize - size / 2 + randomCellPositionX;
            const positionZ = position.z + z * cellSize - size / 2 + randomCellPositionZ;
            const scaling = 0.7 + rng() * 0.6;

            const matrix = Matrix.Compose(
                new Vector3(scaling, scaling, scaling),
                Quaternion.RotationAxis(Vector3.Up(), rng() * 2 * Math.PI),
                new Vector3(positionX, 0, positionZ),
            );
            matrix.copyToArray(matrixBuffer, 16 * index);

            index += 1;
        }
    }

    return matrixBuffer;
}

export function decomposeModelMatrix(matrix: Float32Array, position: Vector3, rotation: Quaternion, scaling: Vector3) {
    if (
        matrix[0] === undefined ||
        matrix[1] === undefined ||
        matrix[2] === undefined ||
        matrix[3] === undefined ||
        matrix[4] === undefined ||
        matrix[5] === undefined ||
        matrix[6] === undefined ||
        matrix[7] === undefined ||
        matrix[8] === undefined ||
        matrix[9] === undefined ||
        matrix[10] === undefined ||
        matrix[11] === undefined ||
        matrix[12] === undefined ||
        matrix[13] === undefined ||
        matrix[14] === undefined ||
        matrix[15] === undefined
    ) {
        throw new Error("Matrix is not defined");
    }

    position.set(matrix[12], matrix[13], matrix[14]);

    const uniformScale = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]);
    scaling.set(uniformScale, uniformScale, uniformScale);

    /*const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]);
    const scaleY = Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]);
    const scaleZ = Math.sqrt(matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10]);
    scaling.set(scaleX, scaleY, scaleZ);*/

    const rotationMatrix = Matrix.Identity();
    rotationMatrix.setRowFromFloats(0, matrix[0] / uniformScale, matrix[1] / uniformScale, matrix[2] / uniformScale, 0);
    rotationMatrix.setRowFromFloats(1, matrix[4] / uniformScale, matrix[5] / uniformScale, matrix[6] / uniformScale, 0);
    rotationMatrix.setRowFromFloats(
        2,
        matrix[8] / uniformScale,
        matrix[9] / uniformScale,
        matrix[10] / uniformScale,
        0,
    );
    rotationMatrix.setRowFromFloats(3, 0, 0, 0, 1);

    rotation.copyFrom(Quaternion.FromRotationMatrix(rotationMatrix));
}

export function applyTransformationToBuffer(transformation: Matrix, matrixBuffer: Float32Array): Float32Array {
    const nbMatrices = Math.floor(matrixBuffer.length / 16);
    const result = new Float32Array(matrixBuffer.length);
    for (let i = 0; i < nbMatrices; i++) {
        const index = i * 16;
        const matrix = Matrix.FromArray(matrixBuffer, index);
        matrix.multiplyToRef(transformation, matrix);
        matrix.copyToArray(result, index);
    }
    return result;
}
