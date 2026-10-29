//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { Settings } from "@/settings";

const SAMPLES_PER_CELL = 4;
const POINT_STRIDE = 6;

/**
 * Samples positions and unit normals for scattering on sufficiently fine terrain grids.
 * @param positions Chunk-local positions in metres, packed as three floats per vertex.
 * @param normals Surface normals packed as three floats per vertex.
 * @param rowVertexCount Number of vertices along each side of the square grid.
 * @param chunkSize Chunk side length in metres.
 * @param rng Random samples in the range [0, 1).
 * @returns Interleaved positions and normals, or an empty buffer when the grid is too coarse.
 */
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

/**
 * Bilinearly interpolates a three-component vector from a grid cell.
 * @param source Vectors packed as three floats per grid vertex.
 * @param bottomLeft Bottom-left vertex index.
 * @param bottomRight Bottom-right vertex index.
 * @param topLeft Top-left vertex index.
 * @param topRight Top-right vertex index.
 * @param u Horizontal interpolation factor.
 * @param v Vertical interpolation factor.
 * @param destination Buffer receiving the interpolated vector.
 * @param destinationOffset First destination component index.
 */
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

/**
 * Normalizes a packed three-component vector in place, leaving zero vectors unchanged.
 * @param vector Mutable packed vector buffer.
 * @param offset Index of the first component to normalize.
 */
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

/**
 * Linearly interpolates between two values.
 * @param from Starting value.
 * @param to Ending value.
 * @param amount Interpolation factor.
 * @returns Interpolated value.
 */
function lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
}
