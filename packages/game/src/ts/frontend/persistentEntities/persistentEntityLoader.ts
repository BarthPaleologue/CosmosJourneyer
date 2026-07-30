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

import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";

import { wait } from "@/utils/wait";

import type {
    GroundedPersistentEntityModel,
    OrbitalPersistentEntityModel,
    PersistentEntityModel,
} from "../../backend/persistentEntities/persistentEntityModel";
import type { TelluricPlanet } from "../universe/planets/telluricPlanet/telluricPlanet";
import type { ITerrainSystem } from "../universe/planets/telluricPlanet/terrain/system/terrainSystem";
import type { GeographicCoordinates } from "../universe/planets/telluricPlanet/terrain/system/terrainTaskInputs";
import { initContent } from "./contentLoader";
import { GroundedPersistentEntity, OrbitalPersistentEntity } from "./persistentEntity";

export type PersistentEntityLoaderOutput = {
    grounded: Array<GroundedPersistentEntity>;
    orbital: Array<OrbitalPersistentEntity>;
};

const LoadDelay = 1000;

export async function loadPersistentEntities(
    models: DeepReadonly<Array<PersistentEntityModel>>,
    telluricPlanetAndSatellites: ReadonlyArray<TelluricPlanet>,
    terrainSystem: ITerrainSystem,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor,
): Promise<PersistentEntityLoaderOutput> {
    const groundedModels: Array<DeepReadonly<GroundedPersistentEntityModel>> = [];
    const orbitalModels: Array<DeepReadonly<OrbitalPersistentEntityModel>> = [];

    for (const model of models) {
        switch (model.type) {
            case "grounded":
                groundedModels.push(model);
                break;
            case "orbital":
                orbitalModels.push(model);
                break;
        }
    }

    const orbitalEntities = await initOrbitalPersistentEntities(orbitalModels, scene, progressMonitor);
    const groundedEntities = await initGroundedPersistentEntities(
        groundedModels,
        telluricPlanetAndSatellites,
        terrainSystem,
        scene,
        progressMonitor,
    );

    return {
        orbital: orbitalEntities,
        grounded: groundedEntities,
    };
}

async function initOrbitalPersistentEntities(
    models: DeepReadonly<Array<OrbitalPersistentEntityModel>>,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Array<OrbitalPersistentEntity>> {
    for (let i = 0; i < models.length; i++) {
        progressMonitor.startTask();
    }

    const orbitalEntities: Array<OrbitalPersistentEntity> = [];

    for (const model of models) {
        const content = await initContent(model.content, scene, progressMonitor);
        orbitalEntities.push(new OrbitalPersistentEntity(content, model.orbitalObject));
        progressMonitor.completeTask();
        await wait(LoadDelay);
    }

    return orbitalEntities;
}

async function initGroundedPersistentEntities(
    models: DeepReadonly<Array<GroundedPersistentEntityModel>>,
    telluricPlanetAndSatellites: ReadonlyArray<TelluricPlanet>,
    terrainSystem: ITerrainSystem,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Array<GroundedPersistentEntity>> {
    for (let i = 0; i < models.length; i++) {
        progressMonitor.startTask();
    }

    const objectIdToModels: Map<string, Array<DeepReadonly<GroundedPersistentEntityModel>>> = new Map();
    for (const model of models) {
        const objectId = model.location.objectId;
        const existingModels = objectIdToModels.get(objectId) ?? [];
        existingModels.push(model);
        objectIdToModels.set(objectId, existingModels);
    }

    const groundedEntities: Array<GroundedPersistentEntity> = [];
    for (const [objectId, objectModels] of objectIdToModels.entries()) {
        const object = telluricPlanetAndSatellites.find((element) => element.model.id === objectId);
        if (object === undefined) {
            console.warn(`Could not find object in system referenced by grounded entity models: ${objectId}`);
            continue;
        }

        const coordinates: Array<GeographicCoordinates> = objectModels.map((model) => model.location);
        const taskId = terrainSystem.requestHeights({
            coordinates,
            planetModel: object.model,
        });

        let result = terrainSystem.getHeightsOutput(taskId);
        while (result === undefined || result.status !== "heightComputed") {
            terrainSystem.update();
            await wait(LoadDelay);
            result = terrainSystem.getHeightsOutput(taskId);
        }

        const heights = result.heights;

        for (const [i, model] of objectModels.entries()) {
            const localHeight = heights[i];
            if (localHeight === undefined) {
                continue;
            }

            const content = await initContent(model.content, scene, progressMonitor);
            const entity = new GroundedPersistentEntity(
                content,
                model.location,
                object.model.radius + localHeight,
                object.getTransform(),
            );

            groundedEntities.push(entity);
            progressMonitor.completeTask();
            await wait(LoadDelay);
        }
    }

    return groundedEntities;
}
