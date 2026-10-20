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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { DeepReadonly, Result } from "@cosmos-journeyer/typescript";

import type { OnSurfacePlacementModel, OnSurfacePlacementRotation } from "@/backend/systemEntity/systemEntityModel";

import { wait } from "@/utils/wait";

import type { OrbitalObject } from "../universe/architecture/orbitalObject";
import type { TelluricPlanet } from "../universe/planets/telluricPlanet/telluricPlanet";
import type { ITerrainSystem, TaskId } from "../universe/planets/telluricPlanet/terrain/system/terrainSystem";
import type { GeographicCoordinates } from "../universe/planets/telluricPlanet/terrain/system/terrainTaskInputs";
import type { OnSurfacePlacement } from "./systemEntity";

export type SurfacePlacementRequest = Readonly<{
    entityId: string;
    placementModel: DeepReadonly<OnSurfacePlacementModel>;
}>;

type SurfaceBatch = Readonly<{
    parent: TelluricPlanet;
    placements: ReadonlyArray<SurfacePlacementRequest>;
}>;

type SurfaceTerrainResult = Readonly<{
    batch: SurfaceBatch;
    heights: Float32Array;
}>;

/**
 * Resolves terrain heights and creates transforms for all surface placements.
 * @param entityIdToPlacementModel Entity identifiers paired with placement models.
 * @param orbitalObjects Orbital objects used to resolve placement parents.
 * @param terrainSystem Terrain query service for surface heights.
 * @param scene Scene that owns the resulting placement transforms.
 * @returns Placements keyed by entity ID, or an error if a parent or height query fails.
 */
export async function createOnSurfacePlacements(
    entityIdToPlacementModel: Iterable<SurfacePlacementRequest>,
    orbitalObjects: ReadonlyArray<OrbitalObject>,
    terrainSystem: ITerrainSystem,
    scene: Scene,
): Promise<Result<Map<string, OnSurfacePlacement>, Error>> {
    const parentIdToPlacements = groupPlacementModelsByParent(entityIdToPlacementModel);

    const pendingTerrainTasks = queryTerrainSystemForPlacements(parentIdToPlacements, terrainSystem, orbitalObjects);

    if (!pendingTerrainTasks.success) {
        return pendingTerrainTasks;
    }

    const terrainResults = await collectTerrainResults(pendingTerrainTasks.value, terrainSystem);
    if (!terrainResults.success) {
        return terrainResults;
    }

    return createPlacementsFromTerrainResults(terrainResults.value, scene);
}

/**
 * Groups placement requests by their referenced parent body.
 * @param entityIdToPlacementModel Placement requests to group.
 * @returns Placement requests grouped by parent object ID.
 */
function groupPlacementModelsByParent(
    entityIdToPlacementModel: Iterable<SurfacePlacementRequest>,
): Map<string, Array<SurfacePlacementRequest>> {
    const parentIdToPlacementModels = new Map<string, Array<SurfacePlacementRequest>>();
    for (const { entityId, placementModel } of entityIdToPlacementModel) {
        const parentId = placementModel.parentId;
        const existingModels = parentIdToPlacementModels.get(parentId) ?? [];
        existingModels.push({ entityId, placementModel });
        parentIdToPlacementModels.set(parentId, existingModels);
    }

    return parentIdToPlacementModels;
}

/**
 * Requests terrain heights for each placement group.
 * @param parentIdToPlacements Placement groups keyed by parent object ID.
 * @param terrainSystem Terrain service receiving height requests.
 * @param orbitalObjects Current-system objects used to find each parent.
 * @returns Pending task IDs and their placement batches, or an error for an invalid parent.
 */
function queryTerrainSystemForPlacements(
    parentIdToPlacements: Map<string, Array<SurfacePlacementRequest>>,
    terrainSystem: ITerrainSystem,
    orbitalObjects: ReadonlyArray<OrbitalObject>,
): Result<Map<TaskId, SurfaceBatch>, Error> {
    const pending = new Map<TaskId, SurfaceBatch>();
    for (const [parentId, placements] of parentIdToPlacements) {
        const parent = orbitalObjects.find((object) => object.model.id === parentId);
        if (parent === undefined) {
            return err(new Error(`Could not find parent: ${parentId}`));
        }

        if (parent.type !== "telluricPlanet" && parent.type !== "telluricSatellite") {
            return err(new Error(`On surface entities reference a non telluric object: ${parentId}`));
        }

        const coordinates: Array<GeographicCoordinates> = placements.map(({ placementModel }) => ({
            latitude: placementModel.position.latitude,
            longitude: placementModel.position.longitude,
        }));

        const taskId = terrainSystem.requestHeights({
            planetModel: parent.model,
            coordinates,
        });

        pending.set(taskId, {
            parent: parent,
            placements,
        });
    }

    return ok(pending);
}

/**
 * Waits for each requested terrain height batch to finish.
 * @param pending Terrain tasks and the placement batches they serve.
 * @param terrainSystem Terrain service that advances and reports task results.
 * @returns Completed height batches, or an error if a task fails.
 */
async function collectTerrainResults(
    pending: Map<TaskId, SurfaceBatch>,
    terrainSystem: ITerrainSystem,
): Promise<Result<Array<SurfaceTerrainResult>, Error>> {
    const terrainResults: Array<SurfaceTerrainResult> = [];
    while (pending.size > 0) {
        terrainSystem.update();
        for (const [taskId, batch] of pending) {
            const output = terrainSystem.getHeightsOutput(taskId);
            if (output === undefined || output.status === "pending") {
                continue;
            }

            if (output.status === "failed") {
                pending.delete(taskId);
                return err(new Error(`Task ${taskId} failed`));
            }

            terrainResults.push({ batch, heights: output.heights });
            pending.delete(taskId);
        }

        if (pending.size > 0) {
            await wait(16);
        }
    }

    return ok(terrainResults);
}

/**
 * Builds surface placement transforms from completed terrain height batches.
 * @param terrainResults Completed terrain batches and their sampled heights.
 * @param scene Scene that owns the resulting transforms.
 * @returns Placements keyed by entity ID, or an error when a height is missing.
 */
function createPlacementsFromTerrainResults(
    terrainResults: Iterable<SurfaceTerrainResult>,
    scene: Scene,
): Result<Map<string, OnSurfacePlacement>, Error> {
    const entityIdToPlacement: Map<string, OnSurfacePlacement> = new Map();
    for (const {
        batch: { parent, placements },
        heights,
    } of terrainResults) {
        for (const [i, { entityId, placementModel }] of placements.entries()) {
            const terrainHeight = heights[i];
            if (terrainHeight === undefined) {
                return err(new Error(`ground height at index ${i} had no corresponding surface placement`));
            }

            const placement = createOnSurfacePlacement(entityId, placementModel, terrainHeight, parent, scene);

            entityIdToPlacement.set(entityId, placement);
        }
    }

    return ok(entityIdToPlacement);
}

/**
 * Places one entity at its requested coordinates above a planet's terrain.
 * @param entityId Entity identifier used to name the transform.
 * @param model Surface position and orientation requested by the entity model.
 * @param terrainHeight Sampled terrain elevation at the placement coordinates.
 * @param planet Planet that owns the surface placement.
 * @param scene Scene that owns the placement transform.
 * @returns The placement contract backed by the created transform.
 */
function createOnSurfacePlacement(
    entityId: string,
    model: DeepReadonly<OnSurfacePlacementModel>,
    terrainHeight: number,
    planet: TelluricPlanet,
    scene: Scene,
): OnSurfacePlacement {
    const { latitude, longitude, heightAboveGround } = model.position;

    const radius = planet.model.radius + terrainHeight + heightAboveGround;

    const transform = new TransformNode(`${entityId}_on_surface_placement`, scene);

    const { position, rotation } = createSurfaceTransform(latitude, longitude, radius, model.rotation);

    transform.position.copyFrom(position);
    transform.rotationQuaternion = rotation;

    transform.parent = planet.getTransform();

    return {
        type: "onSurface",
        getTransform: () => transform,
    };
}

/**
 * Computes a local surface position and orientation from spherical coordinates.
 * @param latitude Latitude in radians.
 * @param longitude Longitude in radians.
 * @param radius Distance from the planet center.
 * @param rotation Heading, pitch, and roll relative to the local surface frame.
 * @returns Position and orientation in the planet's local coordinate system.
 */
function createSurfaceTransform(
    latitude: number,
    longitude: number,
    radius: number,
    rotation: DeepReadonly<OnSurfacePlacementRotation>,
): { position: Vector3; rotation: Quaternion } {
    const { heading, pitch, roll } = rotation;

    const sinLatitude = Math.sin(latitude);
    const cosLatitude = Math.cos(latitude);
    const sinLongitude = Math.sin(longitude);
    const cosLongitude = Math.cos(longitude);

    const up = new Vector3(cosLatitude * cosLongitude, sinLatitude, cosLatitude * sinLongitude);
    const north = new Vector3(-sinLatitude * cosLongitude, cosLatitude, -sinLatitude * sinLongitude);
    const east = new Vector3(-sinLongitude, 0, cosLongitude);

    // heading = 0 => north
    // heading = π/2 => east
    const horizontalForward = north
        .scale(Math.cos(heading))
        .addInPlace(east.scale(Math.sin(heading)))
        .normalize();

    // Positive pitch = nose up.
    const forward = horizontalForward
        .scale(Math.cos(pitch))
        .addInPlace(up.scale(Math.sin(pitch)))
        .normalize();

    // The corresponding up before roll.
    const pitchedUp = up
        .scale(Math.cos(pitch))
        .subtractInPlace(horizontalForward.scale(Math.sin(pitch)))
        .normalize();

    // Roll is intrinsic: rotation around the final forward axis.
    const rolledUp = Vector3.Zero();
    pitchedUp.rotateByQuaternionToRef(Quaternion.RotationAxis(forward, roll), rolledUp);

    return { position: up.scale(radius), rotation: Quaternion.FromLookDirectionRH(forward, rolledUp) };
}
