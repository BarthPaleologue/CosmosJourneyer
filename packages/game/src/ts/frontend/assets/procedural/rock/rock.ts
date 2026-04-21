//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { MeshBuilder, Scalar, Vector3, VertexBuffer, VertexData, type Mesh } from "@babylonjs/core";
import { type Scene } from "@babylonjs/core/scene";

export type ProceduralRockOptions = Readonly<{
    radius?: number;
    subdivisions?: number;
}>;

export type RockGenerationParameters = {
    seed: number;
    warpStrength: number;
    largeStrength: number;
    mediumStrength: number;
    chippedStrength: number;
    macroCellFrequency: number;
    macroCellStrength: number;
    cellBorderStrength: number;
    microCellFrequency: number;
    microChipStrength: number;
    bottomFlatteningStrength: number;
    verticalSquash: number;
    smoothness: number;
};

type WorleyDistances = {
    nearestDistance: number;
    secondNearestDistance: number;
};

export type ProceduralRockAsset = Readonly<{
    mesh: Mesh;
    originalPositions: ReadonlyArray<number>;
    indices: ReadonlyArray<number>;
}>;

export const DefaultRockParameters: Readonly<RockGenerationParameters> = {
    seed: 0,
    warpStrength: 0.45,
    largeStrength: 0.85,
    mediumStrength: 0.3,
    chippedStrength: 0.1,
    macroCellFrequency: 0.5,
    macroCellStrength: 0.15,
    cellBorderStrength: 0.1,
    microCellFrequency: 3.0,
    microChipStrength: 0.13,
    bottomFlatteningStrength: 0.22,
    verticalSquash: 0.8,
    smoothness: 0.5,
};

function getRequiredValue(values: ArrayLike<number>, index: number): number {
    const value = values[index];
    if (value === undefined) {
        throw new Error(`Missing procedural rock data at index ${index}`);
    }

    return value;
}

function fract(value: number): number {
    return value - Math.floor(value);
}

function hash31(x: number, y: number, z: number): number {
    return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123);
}

function seededHash31(x: number, y: number, z: number, seed: number): number {
    const seedOffset = seed * 0.61803398875;
    return hash31(x + seedOffset * 13.37, y - seedOffset * 7.91, z + seedOffset * 5.47);
}

function smoothstep(value: number): number {
    return value * value * (3.0 - 2.0 * value);
}

function valueNoise3(x: number, y: number, z: number, seed: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);

    const fx = x - ix;
    const fy = y - iy;
    const fz = z - iz;

    const ux = smoothstep(fx);
    const uy = smoothstep(fy);
    const uz = smoothstep(fz);

    const h = (dx: number, dy: number, dz: number) => seededHash31(ix + dx, iy + dy, iz + dz, seed);

    const n000 = h(0, 0, 0);
    const n100 = h(1, 0, 0);
    const n010 = h(0, 1, 0);
    const n110 = h(1, 1, 0);
    const n001 = h(0, 0, 1);
    const n101 = h(1, 0, 1);
    const n011 = h(0, 1, 1);
    const n111 = h(1, 1, 1);

    const nx00 = Scalar.Lerp(n000, n100, ux);
    const nx10 = Scalar.Lerp(n010, n110, ux);
    const nx01 = Scalar.Lerp(n001, n101, ux);
    const nx11 = Scalar.Lerp(n011, n111, ux);

    const nxy0 = Scalar.Lerp(nx00, nx10, uy);
    const nxy1 = Scalar.Lerp(nx01, nx11, uy);

    return Scalar.Lerp(nxy0, nxy1, uz) * 2.0 - 1.0;
}

function fbm3(x: number, y: number, z: number, seed: number, octaves = 4): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1.0;

    for (let i = 0; i < octaves; i++) {
        value += amplitude * valueNoise3(x * frequency, y * frequency, z * frequency, seed);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

function ridge3(x: number, y: number, z: number, seed: number, octaves = 4): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1.0;

    for (let i = 0; i < octaves; i++) {
        const noise = valueNoise3(x * frequency, y * frequency, z * frequency, seed);
        value += amplitude * (1.0 - Math.abs(noise));
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value * 2.0 - 1.0;
}

function worley3(x: number, y: number, z: number, seed: number): WorleyDistances {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const cellZ = Math.floor(z);

    let nearestDistanceSquared = Number.POSITIVE_INFINITY;
    let secondNearestDistanceSquared = Number.POSITIVE_INFINITY;

    for (let offsetX = -1; offsetX <= 1; offsetX++) {
        for (let offsetY = -1; offsetY <= 1; offsetY++) {
            for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
                const sampleCellX = cellX + offsetX;
                const sampleCellY = cellY + offsetY;
                const sampleCellZ = cellZ + offsetZ;

                const featureX =
                    sampleCellX + seededHash31(sampleCellX + 17.3, sampleCellY + 3.1, sampleCellZ + 11.7, seed);
                const featureY =
                    sampleCellY + seededHash31(sampleCellX - 5.9, sampleCellY + 29.4, sampleCellZ + 0.7, seed);
                const featureZ =
                    sampleCellZ + seededHash31(sampleCellX + 13.6, sampleCellY - 9.2, sampleCellZ + 23.1, seed);

                const deltaX = featureX - x;
                const deltaY = featureY - y;
                const deltaZ = featureZ - z;
                const distanceSquared = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;

                if (distanceSquared < nearestDistanceSquared) {
                    secondNearestDistanceSquared = nearestDistanceSquared;
                    nearestDistanceSquared = distanceSquared;
                } else if (distanceSquared < secondNearestDistanceSquared) {
                    secondNearestDistanceSquared = distanceSquared;
                }
            }
        }
    }

    return {
        nearestDistance: Math.sqrt(nearestDistanceSquared),
        secondNearestDistance: Math.sqrt(secondNearestDistanceSquared),
    };
}

export function applyProceduralRockGeometry(
    mesh: Mesh,
    originalPositions: ReadonlyArray<number>,
    indices: ReadonlyArray<number>,
    parameters: RockGenerationParameters,
): void {
    const vertexPositions = originalPositions.slice();

    const point = Vector3.Zero();
    const radial = Vector3.Zero();
    const current = Vector3.Zero();
    const original = Vector3.Zero();
    const average = Vector3.Zero();

    const seed = Math.round(parameters.seed);
    const directionA = new Vector3(
        seededHash31(0.8, 0.2, -0.5, seed) * 2.0 - 1.0,
        seededHash31(1.3, -2.4, 0.7, seed) * 2.0 - 1.0,
        seededHash31(-1.8, 0.6, 2.1, seed) * 2.0 - 1.0,
    ).normalize();
    const directionB = new Vector3(
        seededHash31(-0.4, 0.7, 0.6, seed + 17) * 2.0 - 1.0,
        seededHash31(2.8, -0.1, 1.9, seed + 17) * 2.0 - 1.0,
        seededHash31(-3.1, 1.7, -0.8, seed + 17) * 2.0 - 1.0,
    ).normalize();

    const warpStrength = parameters.warpStrength;
    const largeStrength = parameters.largeStrength;
    const mediumStrength = parameters.mediumStrength;
    const chippedStrength = parameters.chippedStrength;
    const macroCellFrequency = parameters.macroCellFrequency;
    const macroCellStrength = parameters.macroCellStrength;
    const cellBorderStrength = parameters.cellBorderStrength;
    const microCellFrequency = parameters.microCellFrequency;
    const microChipStrength = parameters.microChipStrength;
    const bottomFlatteningStrength = parameters.bottomFlatteningStrength;
    const verticalSquash = parameters.verticalSquash;
    const smoothness = parameters.smoothness;

    for (let i = 0; i < vertexPositions.length; i += 3) {
        point.set(
            getRequiredValue(vertexPositions, i),
            getRequiredValue(vertexPositions, i + 1),
            getRequiredValue(vertexPositions, i + 2),
        );
        radial.copyFrom(point).normalize();

        const warpX = fbm3(point.x * 0.9 + 11.2, point.y * 0.9, point.z * 0.9, seed + 101, 2) * warpStrength;
        const warpY = fbm3(point.x * 0.9, point.y * 0.9 + 7.4, point.z * 0.9, seed + 211, 2) * warpStrength;
        const warpZ = fbm3(point.x * 0.9, point.y * 0.9, point.z * 0.9 + 19.1, seed + 307, 2) * warpStrength;

        const sampleX = point.x + warpX;
        const sampleY = point.y + warpY;
        const sampleZ = point.z + warpZ;

        const largeShape = fbm3(sampleX * 0.8, sampleY * 0.8, sampleZ * 0.8, seed + 401, 3) * largeStrength;
        const mediumShape =
            fbm3(sampleX * 1.9 + 21.3, sampleY * 1.9 - 8.1, sampleZ * 1.9 + 4.7, seed + 503, 3) * mediumStrength;
        const chippedDetail =
            ridge3(sampleX * 4.8 - 5.0, sampleY * 4.8 + 3.0, sampleZ * 4.8 + 17.0, seed + 601, 3) * chippedStrength;
        const voronoiMacro = worley3(
            sampleX * macroCellFrequency + 8.0,
            sampleY * macroCellFrequency - 3.0,
            sampleZ * macroCellFrequency + 14.0,
            seed + 701,
        );
        const voronoiMicro = worley3(
            sampleX * microCellFrequency - 19.0,
            sampleY * microCellFrequency + 5.0,
            sampleZ * microCellFrequency + 2.0,
            seed + 809,
        );

        const cellLobes = Scalar.Clamp(1.0 - voronoiMacro.nearestDistance * 1.35, 0, 1) * 2.0 - 1.0;
        const cellBorders = Scalar.Clamp(
            1.0 - (voronoiMacro.secondNearestDistance - voronoiMacro.nearestDistance) * 4.5,
            0,
            1,
        );
        const microChips = Scalar.Clamp(
            1.0 - (voronoiMicro.secondNearestDistance - voronoiMicro.nearestDistance) * 6.0,
            0,
            1,
        );
        const cellularShape =
            cellLobes * macroCellStrength - cellBorders * cellBorderStrength - microChips * microChipStrength;

        const bottomFlattening = Math.max(0, -radial.y) * bottomFlatteningStrength;
        const directionalBias =
            Math.max(0, Vector3.Dot(radial, directionA)) * 0.18 - Math.max(0, Vector3.Dot(radial, directionB)) * 0.1;

        let displacement = largeShape + mediumShape + chippedDetail + cellularShape + directionalBias;
        displacement -= bottomFlattening;

        point.addInPlace(radial.scale(displacement));
        point.y *= verticalSquash;

        vertexPositions[i] = point.x;
        vertexPositions[i + 1] = point.y;
        vertexPositions[i + 2] = point.z;
    }

    const neighbors = Array.from({ length: vertexPositions.length / 3 }, () => new Set<number>());

    for (let i = 0; i < indices.length; i += 3) {
        const a = getRequiredValue(indices, i);
        const b = getRequiredValue(indices, i + 1);
        const c = getRequiredValue(indices, i + 2);

        const neighborsA = neighbors[a];
        const neighborsB = neighbors[b];
        const neighborsC = neighbors[c];

        if (neighborsA === undefined || neighborsB === undefined || neighborsC === undefined) {
            throw new Error("Failed to compute procedural rock adjacency");
        }

        neighborsA.add(b);
        neighborsA.add(c);
        neighborsB.add(a);
        neighborsB.add(c);
        neighborsC.add(a);
        neighborsC.add(b);
    }

    const minimumRelaxStrength = Scalar.Lerp(0.02, 0.22, smoothness);
    const maximumRelaxStrength = Scalar.Lerp(0.04, 0.1, smoothness);

    for (let iteration = 0; iteration < 2; iteration++) {
        const nextPositions = vertexPositions.slice();

        for (let vertexIndex = 0; vertexIndex < neighbors.length; vertexIndex++) {
            const baseIndex = vertexIndex * 3;
            current.set(
                getRequiredValue(vertexPositions, baseIndex),
                getRequiredValue(vertexPositions, baseIndex + 1),
                getRequiredValue(vertexPositions, baseIndex + 2),
            );
            original
                .set(
                    getRequiredValue(originalPositions, baseIndex),
                    getRequiredValue(originalPositions, baseIndex + 1),
                    getRequiredValue(originalPositions, baseIndex + 2),
                )
                .normalize();

            average.set(0, 0, 0);
            let count = 0;

            const neighborSet = neighbors[vertexIndex];
            if (neighborSet === undefined) {
                throw new Error(`Missing procedural rock neighbor set at index ${vertexIndex}`);
            }

            for (const neighborIndex of neighborSet) {
                const neighborBaseIndex = neighborIndex * 3;
                average.x += getRequiredValue(vertexPositions, neighborBaseIndex);
                average.y += getRequiredValue(vertexPositions, neighborBaseIndex + 1);
                average.z += getRequiredValue(vertexPositions, neighborBaseIndex + 2);
                count++;
            }

            if (count === 0) {
                continue;
            }

            average.scaleInPlace(1 / count);

            const preserve = Scalar.Clamp((original.y + 1.0) * 0.5, 0, 1);
            const relaxStrength = Scalar.Lerp(minimumRelaxStrength, maximumRelaxStrength, preserve);
            const relaxed = Vector3.Lerp(current, average, relaxStrength);

            nextPositions[baseIndex] = relaxed.x;
            nextPositions[baseIndex + 1] = relaxed.y;
            nextPositions[baseIndex + 2] = relaxed.z;
        }

        for (let i = 0; i < vertexPositions.length; i++) {
            vertexPositions[i] = getRequiredValue(nextPositions, i);
        }
    }

    mesh.updateVerticesData(VertexBuffer.PositionKind, vertexPositions);

    const normals: Array<number> = [];
    VertexData.ComputeNormals(vertexPositions, indices, normals);
    mesh.updateVerticesData(VertexBuffer.NormalKind, normals);
    mesh.refreshBoundingInfo();
}

export function updateProceduralRockGeometry(rock: ProceduralRockAsset, parameters: RockGenerationParameters): void {
    applyProceduralRockGeometry(rock.mesh, rock.originalPositions, rock.indices, parameters);
}

export function createProceduralRock(
    name: string,
    scene: Scene,
    parameters: RockGenerationParameters,
    options: ProceduralRockOptions = {},
): ProceduralRockAsset {
    const radius = options.radius ?? 1.6;
    const subdivisions = options.subdivisions ?? 5;

    const mesh = MeshBuilder.CreateIcoSphere(
        name,
        {
            radius,
            subdivisions,
            updatable: true,
        },
        scene,
    );
    mesh.forceSharedVertices();

    const vertexPositionData = mesh.getVerticesData(VertexBuffer.PositionKind);
    const indexData = mesh.getIndices();
    if (vertexPositionData === null || indexData === null) {
        throw new Error("Failed to build the procedural rock mesh");
    }

    const rock = {
        mesh,
        originalPositions: Array.from(vertexPositionData),
        indices: Array.from(indexData),
    } satisfies ProceduralRockAsset;

    updateProceduralRockGeometry(rock, parameters);

    return rock;
}
