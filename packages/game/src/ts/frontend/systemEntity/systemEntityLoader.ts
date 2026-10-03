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

import type {
    InOrbitPlacementModel,
    OnSurfacePlacementModel,
    SystemEntityPlacementModel,
    SystemEntityModel,
} from "@/backend/systemEntity/systemEntityModel";

import type { ITerrainSystem } from "../universe/planets/telluricPlanet/terrain/system/terrainSystem";
import type { StarSystemLoaderOutput } from "../universe/starSystemLoader";
import type {
    AnySystemContentType,
    ContentModelOf,
    SystemEntityPlacement,
    OnSurfacePlacement,
    InOrbitPlacement,
    SystemContentFactoryContext,
    SystemContentFactoryOf,
    SystemEntity,
} from "./systemEntity";

type ErasedSystemContentFactory = SystemContentFactoryOf<AnySystemContentType>;

export class SystemEntityLoader {
    private readonly registry: Map<string, ErasedSystemContentFactory> = new Map();

    registerFactory<T extends AnySystemContentType>(type: T, factory: SystemContentFactoryOf<T>): void {
        if (this.registry.has(type)) {
            throw new Error(`A SystemContent factory is already registered for "${type}"`);
        }

        this.registry.set(type, eraseFactory(type, factory));
    }

    async load(
        models: Iterable<DeepReadonly<SystemEntityModel>>,
        orbitalObjects: Readonly<StarSystemLoaderOutput>,
        terrainSystem: ITerrainSystem,
        scene: Scene,
    ): Promise<Result<Array<SystemEntity>, Error>> {
        const systemEntities: Array<SystemEntity> = [];
        const context: SystemContentFactoryContext = { scene };
        for (const model of models) {
            const entityResult = this.createEntity(model, context);
            if (!entityResult.success) {
                return entityResult;
            }

            const entity = entityResult.value;
            if (entity.placement.type === "onSurface") {
                placeSurfaceEntity(entity.placement, orbitalObjects, terrainSystem);
            }

            systemEntities.push(entity);
        }

        await flushSurfacePlacements();

        return ok(systemEntities);
    }

    private createEntity(
        model: DeepReadonly<SystemEntityModel>,
        context: SystemContentFactoryContext,
    ): Result<SystemEntity, Error> {
        const factory = this.registry.get(model.content.type);
        if (factory === undefined) {
            return err(new Error(`No SystemContent factory registered for "${model.content.type}"`));
        }

        const result = factory(model.content, context);
        if (!result.success) {
            return result;
        }

        const content = result.value;

        const placement = createSystemEntityPlacement(model.id, model.placement, context.scene);

        content.getTransform().parent = placement.getTransform();

        return ok({ content: result.value, placement, model });
    }
}

function createSystemEntityPlacement(
    id: string,
    model: DeepReadonly<SystemEntityPlacementModel>,
    scene: Scene,
): SystemEntityPlacement {
    switch (model.type) {
        case "inOrbit":
            return createInOrbitPlacement(id, model, scene);
        case "onSurface":
            return createOnSurfacePlacement(id, model, scene);
    }
}

function createInOrbitPlacement(
    id: string,
    model: DeepReadonly<InOrbitPlacementModel>,
    scene: Scene,
): InOrbitPlacement {
    const transform = new TransformNode(`${id}_in_orbit_placement`, scene);
    return {
        type: "inOrbit",
        id: id,
        mass: model.mass,
        orbit: model.orbit,
        rotation: model.rotation,
        getTransform: () => transform,
    };
}

function createOnSurfacePlacement(
    id: string,
    model: DeepReadonly<OnSurfacePlacementModel>,
    scene: Scene,
): OnSurfacePlacement {
    const transform = new TransformNode(`${id}_on_surface_placement`, scene);
    return {
        type: "onSurface",
        getTransform: () => transform,
    };
}

function eraseFactory<T extends AnySystemContentType>(
    type: T,
    factory: SystemContentFactoryOf<T>,
): ErasedSystemContentFactory {
    return (model, context) => {
        if (model.type !== type) {
            return err(new Error(`Expected model type "${type}", got "${model.type}"`));
        }

        return factory(model as ContentModelOf<T>, context);
    };
}
