//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { createScatterPointBuffer } from "./createScatterPointBuffer";
import type { TerrainBuffers } from "./terrainSystem";

const SKIRT_GENERATION_VERTEX_SPACING_THRESHOLD = 512;

export function assembleTerrainBuffers(
    packedPositions: Float32Array,
    packedNormals: Float32Array,
    rowVertexCount: number,
    chunkSize: number,
    chunkSpherePosition: readonly [number, number, number],
    createScatteredInstances: (pointBuffer: Float32Array) => TerrainBuffers["scatteredInstances"],
): TerrainBuffers {
    const subdivisions = rowVertexCount - 1;
    const baseVertexCount = rowVertexCount * rowVertexCount;
    const shouldGenerateSkirt = chunkSize / subdivisions < SKIRT_GENERATION_VERTEX_SPACING_THRESHOLD;
    const skirtVertexCount = shouldGenerateSkirt ? 4 * rowVertexCount : 0;
    const baseIndexCount = subdivisions * subdivisions * 6;
    const skirtIndexCount = shouldGenerateSkirt ? 4 * subdivisions * 6 : 0;
    const positions = new Float32Array((baseVertexCount + skirtVertexCount) * 3);
    const normals = new Float32Array(positions.length);
    const indices = new Uint16Array(baseIndexCount + skirtIndexCount);

    for (let index = 0; index < baseVertexCount; index++) {
        positions[index * 3] = packedPositions[index * 4] ?? 0;
        positions[index * 3 + 1] = packedPositions[index * 4 + 1] ?? 0;
        positions[index * 3 + 2] = packedPositions[index * 4 + 2] ?? 0;
        normals[index * 3] = packedNormals[index * 4] ?? 0;
        normals[index * 3 + 1] = packedNormals[index * 4 + 1] ?? 0;
        normals[index * 3 + 2] = packedNormals[index * 4 + 2] ?? 0;
    }

    for (let x = 1; x < rowVertexCount; x++) {
        for (let y = 1; y < rowVertexCount; y++) {
            const vertexIndex = x * rowVertexCount + y;
            const indexOffset = 6 * ((x - 1) * subdivisions + (y - 1));
            indices.set(
                [
                    vertexIndex - 1,
                    vertexIndex,
                    vertexIndex - rowVertexCount - 1,
                    vertexIndex,
                    vertexIndex - rowVertexCount,
                    vertexIndex - rowVertexCount - 1,
                ],
                indexOffset,
            );
        }
    }

    if (shouldGenerateSkirt) {
        appendSkirt(positions, normals, indices, rowVertexCount, chunkSpherePosition, chunkSize / subdivisions / 2);
    }

    const scatterPointBuffer = createScatterPointBuffer(positions, normals, rowVertexCount, chunkSize);
    return { positions, normals, indices, scatteredInstances: createScatteredInstances(scatterPointBuffer) };
}

function appendSkirt(
    positions: Float32Array,
    normals: Float32Array,
    indices: Uint16Array,
    rowVertexCount: number,
    chunkSpherePosition: readonly [number, number, number],
    skirtDepth: number,
): void {
    const borderLoops = buildBorderLoops(rowVertexCount);
    let nextVertexIndex = rowVertexCount * rowVertexCount;
    let nextIndexOffset = (rowVertexCount - 1) * (rowVertexCount - 1) * 6;

    for (const borderLoop of borderLoops) {
        const skirtLoop: Array<number> = [];
        for (const sourceIndex of borderLoop) {
            const px = (positions[sourceIndex * 3] ?? 0) + chunkSpherePosition[0];
            const py = (positions[sourceIndex * 3 + 1] ?? 0) + chunkSpherePosition[1];
            const pz = (positions[sourceIndex * 3 + 2] ?? 0) + chunkSpherePosition[2];
            const inverseLength = 1 / Math.hypot(px, py, pz);
            positions[nextVertexIndex * 3] = px - px * inverseLength * skirtDepth - chunkSpherePosition[0];
            positions[nextVertexIndex * 3 + 1] = py - py * inverseLength * skirtDepth - chunkSpherePosition[1];
            positions[nextVertexIndex * 3 + 2] = pz - pz * inverseLength * skirtDepth - chunkSpherePosition[2];
            normals.copyWithin(nextVertexIndex * 3, sourceIndex * 3, sourceIndex * 3 + 3);
            skirtLoop.push(nextVertexIndex++);
        }

        let previousBorderVertex = borderLoop[0];
        let previousSkirtVertex = skirtLoop[0];
        for (let index = 1; index < borderLoop.length; index++) {
            const borderVertex = borderLoop[index];
            const skirtVertex = skirtLoop[index];
            if (
                previousBorderVertex === undefined ||
                previousSkirtVertex === undefined ||
                borderVertex === undefined ||
                skirtVertex === undefined
            ) {
                continue;
            }
            indices.set(
                [
                    previousBorderVertex,
                    borderVertex,
                    previousSkirtVertex,
                    borderVertex,
                    skirtVertex,
                    previousSkirtVertex,
                ],
                nextIndexOffset,
            );
            nextIndexOffset += 6;
            previousBorderVertex = borderVertex;
            previousSkirtVertex = skirtVertex;
        }
    }
}

function buildBorderLoops(rowVertexCount: number): ReadonlyArray<ReadonlyArray<number>> {
    const top: Array<number> = [];
    const right: Array<number> = [];
    const bottom: Array<number> = [];
    const left: Array<number> = [];
    for (let index = 0; index < rowVertexCount; index++) {
        top.push(index);
        right.push(index * rowVertexCount + rowVertexCount - 1);
        bottom.push((rowVertexCount - 1) * rowVertexCount + index);
        left.push(index * rowVertexCount);
    }
    bottom.reverse();
    left.reverse();
    return [top, right, bottom, left];
}
