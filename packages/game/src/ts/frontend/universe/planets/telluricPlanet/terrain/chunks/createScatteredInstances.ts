//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { Axis, Quaternion, Vector3 } from "@babylonjs/core/pure";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { TelluricPlanetModel, TelluricSatelliteModel } from "@cosmos-journeyer/universe-model";

import { AvailableRockSizes } from "@/frontend/assets/objects/rockSizes";
import { filterPoints, MaxScatterDensity } from "@/frontend/helpers/instancing";
import type { ScatteringLayer } from "@/frontend/helpers/instancing";

import { smoothstep } from "@/utils/math";

import { BeachElevationSpan } from "../terrainConstants";
import type { ScatteredInstanceBuffers } from "./scatteringSystem";

export function createScatteredInstances(
    pointBuffer: Float32Array,
    planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
    chunkSpherePosition: readonly [number, number, number],
    densityMultiplier = 1,
): ScatteredInstanceBuffers {
    if (pointBuffer.length === 0) {
        return {};
    }

    const rockLayer: ScatteringLayer = () => ({
        density: scaledDensity(1 / 15 ** 2, densityMultiplier),
        scalingOverride: AvailableRockSizes[Math.floor(AvailableRockSizes.length * Math.random() ** 2)] ?? 1,
        rotationOverride: Quaternion.FromEulerAngles(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
        ),
    });

    if (planetModel.atmosphere === null || planetModel.ocean === null) {
        const [rockBuffer] = filterPoints(pointBuffer, [rockLayer]);
        return { rock: rockBuffer };
    }

    const chunkPosition = Vector3.FromArray(chunkSpherePosition);
    const gravityUp = chunkPosition.normalizeToNew();
    const oceanDepth = planetModel.ocean.depth;
    const grassLayer: ScatteringLayer = (position, normal) => {
        const flatnessMask = smoothstep(0.9, 0.95, normal.dot(gravityUp));
        const heightMask = terrainHeightMask(position, chunkPosition, planetModel.radius, oceanDepth, 0.7, 0.85);
        return {
            density: scaledDensity(MaxScatterDensity * flatnessMask * heightMask, densityMultiplier),
            rotationOverride: alignWithGravity(gravityUp).multiply(
                Quaternion.RotationAxis(Axis.Y, Math.random() * 2 * Math.PI),
            ),
        };
    };
    const treeLayer: ScatteringLayer = (position, normal) => {
        const flatnessMask = smoothstep(0.9, 0.95, normal.dot(gravityUp));
        const heightMask = terrainHeightMask(position, chunkPosition, planetModel.radius, oceanDepth, 0.9, 0.95);
        return {
            density: scaledDensity((1 / 17 ** 2) * flatnessMask * heightMask, densityMultiplier),
            rotationOverride: alignWithGravity(gravityUp).multiply(
                Quaternion.RotationAxis(Axis.Y, Math.random() * 2 * Math.PI),
            ),
            scalingOverride: 0.5 + 2 * Math.random() ** 1.5,
        };
    };
    const butterflyLayer: ScatteringLayer = (position, normal) => {
        const flatnessMask = smoothstep(0.9, 0.95, normal.dot(gravityUp));
        const heightMask = terrainHeightMask(position, chunkPosition, planetModel.radius, oceanDepth, 1.05, 1.1);
        return {
            density: scaledDensity((1 / 7 ** 2) * flatnessMask * heightMask, densityMultiplier),
            rotationOverride: alignWithGravity(gravityUp),
        };
    };

    const [rock, grass, tree, butterfly] = filterPoints(pointBuffer, [
        rockLayer,
        grassLayer,
        treeLayer,
        butterflyLayer,
    ]);
    return { rock, grass, tree, butterfly };
}

function scaledDensity(density: number, multiplier: number): number {
    return Math.min(MaxScatterDensity, density * multiplier);
}

function terrainHeightMask(
    position: Vector3,
    chunkPosition: Vector3,
    radius: number,
    oceanDepth: number,
    lowerFactor: number,
    upperFactor: number,
): number {
    const heightAboveSeaLevel = position.add(chunkPosition).length() - (radius + oceanDepth);
    return smoothstep(
        (lowerFactor * BeachElevationSpan) / 2,
        (upperFactor * BeachElevationSpan) / 2,
        heightAboveSeaLevel,
    );
}

function alignWithGravity(gravityUp: Vector3): Quaternion {
    return Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, gravityUp, Quaternion.Identity());
}
