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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

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
                Vector3.One().scaleInPlace(scaling),
                Quaternion.RotationAxis(Axis.Y, rng() * 2 * Math.PI),
                new Vector3(positionX, 0, positionZ),
            );
            matrix.copyToArray(matrixBuffer, 16 * index);

            index += 1;
        }
    }

    return matrixBuffer;
}

export function createCircleInstanceBuffer(radius: number, nbPoints: number) {
    const buffer = new Float32Array(16 * nbPoints);

    for (let i = 0; i < nbPoints; i++) {
        const theta = (2 * Math.PI * i) / nbPoints;
        const position = new Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta));

        const matrix = Matrix.Compose(
            Vector3.OneReadOnly,
            Quaternion.FromLookDirectionRH(new Vector3(-position.x, 0, -position.z).normalize(), Vector3.UpReadOnly),
            position,
        );
        matrix.copyToArray(buffer, i * 16);
    }

    return buffer;
}

export type ScatteringLayer = (
    position: Vector3,
    normal: Vector3,
) => {
    density: number;
    rotationOverride?: Quaternion;
    scalingOverride?: number;
};

type ScatteringLayerBuffers = {
    matrices: Float32Array<ArrayBuffer>;
    positions: Float32Array<ArrayBuffer>;
    rotations: Float32Array<ArrayBuffer>;
    scales: Float32Array<ArrayBuffer>;
    count: number;
};

type ScatteringLayersBuffers<TLayers extends ReadonlyArray<ScatteringLayer>> = {
    readonly [Index in keyof TLayers]: ScatteringLayerBuffers;
};

export const MaxScatterDensity = 16;

/**
 * @param pointBuffer Buffer of points (stride is 6: 3 for position, 3 for surface normal)
 * @param layers The scattering layers to generate the matrices for. Each layer has a density function that determines the probability of scattering an object at a given position with a given normal. The density function should return a value between 0 and MaxScatterDensity, where 0 means no chance of scattering and MaxScatterDensity means 100% chance of scattering.
 * @returns One Float32Array for each layer, containing the transformation matrices of the scattered objects (16 floats per matrix)
 */
export function filterPoints<const TLayers extends ReadonlyArray<ScatteringLayer>>(
    pointBuffer: Float32Array,
    layers: TLayers,
): ScatteringLayersBuffers<TLayers> {
    const pointStride = 6;

    const instanceBuffers = layers.map(() => {
        return {
            matrices: new Float32Array((pointBuffer.length * 16) / pointStride),
            positions: new Float32Array((pointBuffer.length * 3) / pointStride),
            rotations: new Float32Array((pointBuffer.length * 4) / pointStride),
            scales: new Float32Array(pointBuffer.length / pointStride),
            count: 0,
        };
    });

    const instanceMatrix = Matrix.Identity();
    const instanceRotation = Quaternion.Identity();

    const position = new Vector3();
    const normal = new Vector3();
    const scaling = new Vector3();

    for (let i = 0; i < pointBuffer.length; i += pointStride) {
        Vector3.FromArrayToRef(pointBuffer, i, position);
        Vector3.FromArrayToRef(pointBuffer, i + 3, normal);

        for (let j = 0; j < layers.length; j++) {
            const layer = layers[j];
            const instanceBuffer = instanceBuffers[j];
            if (layer === undefined || instanceBuffer === undefined) {
                continue;
            }

            const { density, rotationOverride, scalingOverride } = layer(position, normal);

            const probability = density / MaxScatterDensity;
            if (Math.random() > probability) {
                continue;
            }

            scaling.setAll(scalingOverride ?? 1);

            if (rotationOverride !== undefined) {
                instanceRotation.copyFrom(rotationOverride);
            } else {
                Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, normal, instanceRotation);
            }

            Matrix.ComposeToRef(scaling, instanceRotation, position, instanceMatrix);

            instanceBuffer.matrices.set(instanceMatrix.m, instanceBuffer.count * 16);
            position.toArray(instanceBuffer.positions, instanceBuffer.count * 3);
            instanceRotation.toArray(instanceBuffer.rotations, instanceBuffer.count * 4);
            instanceBuffer.scales[instanceBuffer.count] = scalingOverride ?? 1;
            instanceBuffer.count++;
        }
    }

    return instanceBuffers.map(
        (b) =>
            ({
                matrices: b.matrices.slice(0, b.count * 16),
                positions: b.positions.slice(0, b.count * 3),
                rotations: b.rotations.slice(0, b.count * 4),
                scales: b.scales.slice(0, b.count),
                count: b.count,
            }) satisfies ScatteringLayerBuffers,
    ) as ScatteringLayersBuffers<TLayers>;
}

export function createInstancePatch(name: string, baseMesh: Mesh, matrixBuffer: Float32Array): Mesh {
    const mesh = baseMesh.clone(name);
    mesh.makeGeometryUnique();
    mesh.isVisible = true;
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.thinInstanceSetBuffer("matrix", matrixBuffer, 16, false);
    return mesh;
}
