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

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { DeepReadonly, Result } from "@cosmos-journeyer/typescript";

import type { InOrbitPlacementModel, SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

import type { OrbitalObject } from "../universe/architecture/orbitalObject";
import type { KeplerianOrbitalSimulation } from "../universe/keplerianOrbitalSimulation";
import type { ITerrainSystem } from "../universe/planets/telluricPlanet/terrain/system/terrainSystem";
import { createOnSurfacePlacements } from "./createOnSurfacePlacements";
import type { SurfacePlacementRequest } from "./createOnSurfacePlacements";
import type {
    AnySystemContentType,
    ContentModelOf,
    SystemContentFactoryOf,
    SystemEntity,
    SystemContent,
    InOrbitPlacement,
} from "./systemEntity";

type ErasedSystemContentFactory = SystemContentFactoryOf<AnySystemContentType>;

export type SystemEntityLoadContext = Readonly<{
    scene: Scene;
    orbitalObjects: ReadonlyArray<OrbitalObject>;
    orbitalSimulation: KeplerianOrbitalSimulation;
    terrainSystem: ITerrainSystem;
}>;

export class SystemEntityLoader {
    private readonly registry: Map<string, ErasedSystemContentFactory> = new Map();

    registerFactory<T extends AnySystemContentType>(type: T, factory: SystemContentFactoryOf<T>): void {
        if (this.registry.has(type)) {
            console.warn(`SystemContent factory overridden for "${type}"`);
        }

        this.registry.set(type, eraseFactory(type, factory));
    }

    async load(
        models: Iterable<DeepReadonly<SystemEntityModel>>,
        context: SystemEntityLoadContext,
    ): Promise<Result<Array<SystemEntity>, Error>> {
        const inOrbitPlacementModels: Array<{ entityId: string; placementModel: DeepReadonly<InOrbitPlacementModel> }> =
            [];
        const onSurfacePlacementModels: Array<SurfacePlacementRequest> = [];
        const entityContents = new Map<string, { model: DeepReadonly<SystemEntityModel>; content: SystemContent }>();
        for (const model of models) {
            const contentResult = this.createContent(model, context.scene);
            if (!contentResult.success) {
                return contentResult;
            }

            entityContents.set(model.id, { model, content: contentResult.value });

            switch (model.placement.type) {
                case "inOrbit":
                    inOrbitPlacementModels.push({ entityId: model.id, placementModel: model.placement });
                    break;
                case "onSurface":
                    onSurfacePlacementModels.push({ entityId: model.id, placementModel: model.placement });
                    break;
            }
        }

        const inOrbitPlacements = createInOrbitPlacements(inOrbitPlacementModels, context);
        const onSurfacePlacementsResult = await createOnSurfacePlacements(
            onSurfacePlacementModels,
            context.orbitalObjects,
            context.terrainSystem,
            context.scene,
        );
        if (!onSurfacePlacementsResult.success) {
            return onSurfacePlacementsResult;
        }

        const onSurfacePlacements = onSurfacePlacementsResult.value;

        const systemEntities: Array<SystemEntity> = [];
        const entityPlacements = [...inOrbitPlacements.entries(), ...onSurfacePlacements.entries()];
        for (const [id, placement] of entityPlacements) {
            const partial = entityContents.get(id);
            if (partial === undefined) {
                return err(new Error(`Could not find content for entity ${id}`));
            }

            const { model, content } = partial;

            content.getTransform().parent = placement.getTransform();
            systemEntities.push({ model, content, placement });
        }

        return ok(systemEntities);
    }

    private createContent(model: DeepReadonly<SystemEntityModel>, scene: Scene): Result<SystemContent, Error> {
        const context = { scene };
        const factory = this.registry.get(model.content.type);
        if (factory === undefined) {
            return err(new Error(`No SystemContent factory registered for "${model.content.type}"`));
        }

        return factory(model.content, context);
    }
}

export function createInOrbitPlacements(
    models: Iterable<{ entityId: string; placementModel: DeepReadonly<InOrbitPlacementModel> }>,
    context: SystemEntityLoadContext,
): Map<string, InOrbitPlacement> {
    const placements = new Map<string, InOrbitPlacement>();
    for (const { entityId, placementModel } of models) {
        const transform = new TransformNode(`${entityId}_in_orbit_placement`, context.scene);
        const placement = {
            type: "inOrbit",
            id: entityId,
            mass: placementModel.mass,
            orbit: placementModel.orbit,
            rotation: placementModel.rotation,
            getTransform: () => transform,
        } as const;
        placements.set(entityId, placement);
        context.orbitalSimulation.addObjects([placement]);
    }

    return placements;
}

function eraseFactory<T extends AnySystemContentType>(
    type: T,
    factory: SystemContentFactoryOf<T>,
): ErasedSystemContentFactory {
    return (model, context) => {
        if (model.type !== type) {
            return err(new Error(`Expected model type "${type}", got "${model.type}"`));
        }

        return factory(model as DeepReadonly<ContentModelOf<T>>, context);
    };
}
