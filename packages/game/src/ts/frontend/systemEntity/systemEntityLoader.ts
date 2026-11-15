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

import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { assertUnreachable, err, ok } from "@cosmos-journeyer/typescript";
import type { DeepReadonly, Result } from "@cosmos-journeyer/typescript";

import type { InOrbitPlacementModel, SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

import type { OrbitalObject } from "../universe/architecture/orbitalObject";
import type { KeplerianOrbitalSimulation } from "../universe/keplerianOrbitalSimulation";
import type { ITerrainSystem } from "../universe/planets/telluricPlanet/terrain/system/terrainSystem";
import { createOnSurfacePlacements } from "./createOnSurfacePlacements";
import type {
    AnySystemContentType,
    ContentModelOf,
    SystemContentFactoryOf,
    SystemEntity,
    SystemContent,
    InOrbitPlacement,
    OnSurfacePlacement,
    SystemEntityPlacement,
    SystemContentFactoryContext,
} from "./systemEntity";

type ErasedSystemContentFactory = SystemContentFactoryOf<AnySystemContentType>;

type EntityContent = {
    model: DeepReadonly<SystemEntityModel>;
    content: SystemContent;
};

export type SystemEntityLoadContext = Readonly<
    SystemContentFactoryContext & {
        orbitalObjects: ReadonlyArray<OrbitalObject>;
        orbitalSimulation: KeplerianOrbitalSimulation;
        terrainSystem: ITerrainSystem;
    }
>;

export class SystemEntityLoader {
    private readonly registry: Map<string, ErasedSystemContentFactory> = new Map();

    registerFactory<T extends AnySystemContentType>(type: T, factory: SystemContentFactoryOf<T>): void {
        if (this.registry.has(type)) {
            console.warn(`SystemContent factory overridden for "${type}"`);
        }

        this.registry.set(type, eraseFactory(type, factory));
    }

    async load(
        models: ReadonlyArray<DeepReadonly<SystemEntityModel>>,
        context: SystemEntityLoadContext,
    ): Promise<Result<Array<SystemEntity>, Error>> {
        const contents: Array<EntityContent> = [];
        const entities: Array<SystemEntity> = [];
        let surfacePlacements = new Map<string, OnSurfacePlacement>();
        const fail = (error: Error): Result<Array<SystemEntity>, Error> => {
            for (const { content } of contents) {
                content.dispose();
            }
            for (const { placement } of entities) {
                if (placement.type !== "onSurface") {
                    placement.getTransform().dispose();
                }
            }
            for (const placement of surfacePlacements.values()) {
                placement.getTransform().dispose();
            }
            return err(error);
        };

        for (const model of models) {
            const content = this.createContent(model, context);
            if (!content.success) {
                return fail(content.error);
            }
            contents.push({ model, content: content.value });
        }

        const surfaceResult = await createOnSurfacePlacements(
            contents.flatMap(({ model }) =>
                model.placement.type === "onSurface" ? [{ entityId: model.id, placementModel: model.placement }] : [],
            ),
            context.orbitalObjects,
            context.terrainSystem,
            context.scene,
        );
        if (!surfaceResult.success) {
            return fail(surfaceResult.error);
        }
        surfacePlacements = surfaceResult.value;

        for (const entry of contents) {
            const entity = createEntity(entry, surfacePlacements, context.scene);
            if (!entity.success) {
                return fail(entity.error);
            }
            entities.push(entity.value);
        }

        context.orbitalSimulation.addObjects(
            entities.flatMap(({ placement }) => (placement.type === "inOrbit" ? [placement] : [])),
        );
        return ok(entities);
    }

    private createContent(
        model: DeepReadonly<SystemEntityModel>,
        context: SystemContentFactoryContext,
    ): Result<SystemContent, Error> {
        const factory = this.registry.get(model.content.type);
        if (factory === undefined) {
            return err(new Error(`No SystemContent factory registered for "${model.content.type}"`));
        }

        return factory(model, context);
    }
}

/**
 * @param entry Content and the resolved placement data used to attach it.
 * @param surfacePlacements Placements already created by the terrain batch.
 * @param scene Scene owning newly created placement transforms.
 * @returns The complete entity, or an error when its surface placement is unavailable.
 */
function createEntity(
    entry: Readonly<EntityContent>,
    surfacePlacements: ReadonlyMap<string, OnSurfacePlacement>,
    scene: Scene,
): Result<SystemEntity, Error> {
    const { model, content } = entry;
    const placementModel = model.placement;
    let placement: SystemEntityPlacement;
    switch (placementModel.type) {
        case "inOrbit": {
            placement = createInOrbitPlacement(model.id, placementModel, scene);
            const { yaw, pitch, roll } = placementModel.attitude.localFrameOrientation;
            content.getTransform().rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, pitch, roll);
            break;
        }
        case "onSurface": {
            const surfacePlacement = surfacePlacements.get(model.id);
            if (surfacePlacement === undefined) {
                return err(new Error(`Could not find surface placement for entity "${model.id}"`));
            }
            placement = surfacePlacement;
            break;
        }
        default:
            return assertUnreachable(placementModel);
    }
    content.getTransform().parent = placement.getTransform();
    return ok({ model, content, placement });
}

/**
 * @param id Entity identifier used by the orbital simulation.
 * @param placementModel Orbital and attitude data.
 * @param scene Scene owning the placement transform.
 * @returns The simulation object for an orbital entity.
 */
export function createInOrbitPlacement(
    id: string,
    placementModel: DeepReadonly<InOrbitPlacementModel>,
    scene: Scene,
): InOrbitPlacement {
    const transform = new TransformNode(`${id}_in_orbit_placement`, scene);
    return {
        type: "inOrbit",
        id,
        mass: placementModel.mass,
        orbit: placementModel.orbit,
        spin: placementModel.attitude.spin,
        getTransform: () => transform,
    } as const;
}

/**
 * Adapts a content factory to the registry's erased model and content types.
 * @param type Content discriminator expected by the factory.
 * @param factory Factory that creates content for the narrowed model type.
 * @returns A registry factory that validates the discriminator before creation.
 */
function eraseFactory<T extends AnySystemContentType>(
    type: T,
    factory: SystemContentFactoryOf<T>,
): ErasedSystemContentFactory {
    return (model, context) => {
        if (model.content.type !== type) {
            return err(new Error(`Expected model type "${type}", got "${model.content.type}"`));
        }

        return factory(model as DeepReadonly<SystemEntityModel<ContentModelOf<T>>>, context);
    };
}
