//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { Settings } from "@/settings";

const SAMPLES_PER_CELL = 4;
const POINT_STRIDE = 6;

export function createScatterPointBuffer(
    positions: Float32Array,
    normals: Float32Array,
    rowVertexCount: number,
    chunkSize: number,
    rng: () => number = Math.random,
): Float32Array {
    const subdivisions = rowVertexCount - 1;
    if (subdivisions <= 0 || chunkSize / subdivisions >= Settings.MIN_DISTANCE_BETWEEN_VERTICES) {
        return new Float32Array();
    }

    const pointBuffer = new Float32Array(subdivisions * subdivisions * SAMPLES_PER_CELL * POINT_STRIDE);
    let pointOffset = 0;
    for (let x = 0; x < subdivisions; x++) {
        for (let y = 0; y < subdivisions; y++) {
            const bottomLeft = x * rowVertexCount + y;
            const bottomRight = bottomLeft + 1;
            const topLeft = bottomLeft + rowVertexCount;
            const topRight = topLeft + 1;

            for (let sample = 0; sample < SAMPLES_PER_CELL; sample++) {
                const u = ((sample % 2) + rng()) / 2;
                const v = (Math.floor(sample / 2) + rng()) / 2;
                interpolateVector(
                    positions,
                    bottomLeft,
                    bottomRight,
                    topLeft,
                    topRight,
                    u,
                    v,
                    pointBuffer,
                    pointOffset,
                );
                interpolateVector(
                    normals,
                    bottomLeft,
                    bottomRight,
                    topLeft,
                    topRight,
                    u,
                    v,
                    pointBuffer,
                    pointOffset + 3,
                );
                normalizeVector(pointBuffer, pointOffset + 3);
                pointOffset += POINT_STRIDE;
            }
        }
    }
    return pointBuffer;
}

function interpolateVector(
    source: Float32Array,
    bottomLeft: number,
    bottomRight: number,
    topLeft: number,
    topRight: number,
    u: number,
    v: number,
    destination: Float32Array,
    destinationOffset: number,
): void {
    for (let component = 0; component < 3; component++) {
        const bottom = lerp(source[bottomLeft * 3 + component] ?? 0, source[bottomRight * 3 + component] ?? 0, u);
        const top = lerp(source[topLeft * 3 + component] ?? 0, source[topRight * 3 + component] ?? 0, u);
        destination[destinationOffset + component] = lerp(bottom, top, v);
    }
}

function normalizeVector(vector: Float32Array, offset: number): void {
    const x = vector[offset] ?? 0;
    const y = vector[offset + 1] ?? 0;
    const z = vector[offset + 2] ?? 0;
    const length = Math.hypot(x, y, z);
    if (length === 0) {
        return;
    }
    vector[offset] = x / length;
    vector[offset + 1] = y / length;
    vector[offset + 2] = z / length;
}

function lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
}
