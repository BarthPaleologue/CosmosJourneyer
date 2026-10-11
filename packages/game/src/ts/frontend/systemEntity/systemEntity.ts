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
import type { DeepReadonly, TagMetadataOf, Result, Tagged } from "@cosmos-journeyer/typescript";

import type { SystemContentModel, SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

import type { Transformable } from "../universe/architecture/transformable";
import type { KeplerianObject } from "../universe/keplerianOrbitalSimulation";

export type SystemContentType<TModel extends SystemContentModel, TContent extends SystemContent> = Tagged<
    TModel["type"],
    "SystemContentType",
    { Model: TModel; Content: TContent }
>;

export function makeSystemContentType<TModel extends SystemContentModel, TContent extends SystemContent>(
    type: TModel["type"],
): SystemContentType<TModel, TContent> {
    return type as SystemContentType<TModel, TContent>;
}

export type AnySystemContentType = SystemContentType<SystemContentModel, SystemContent>;

export type SystemEntity<T extends AnySystemContentType = AnySystemContentType> = Readonly<{
    model: DeepReadonly<SystemEntityModel<ContentModelOf<T>>>;
    content: ContentOf<T>;
    placement: SystemEntityPlacement;
}>;

export type SystemEntityPlacement = InOrbitPlacement | OnSurfacePlacement;

export type InOrbitPlacement = { type: "inOrbit" } & KeplerianObject;

export type OnSurfacePlacement = { type: "onSurface" } & Transformable;

export interface SystemContent extends Transformable {
    dispose(): void;
}

export type ContentModelOf<T extends AnySystemContentType> =
    TagMetadataOf<T> extends { Model: infer TModel extends SystemContentModel } ? TModel : never;

export type ContentOf<T extends AnySystemContentType> =
    TagMetadataOf<T> extends { Content: infer TContent extends SystemContent } ? TContent : never;

export type SystemContentFactoryOf<T extends AnySystemContentType> = (
    model: DeepReadonly<ContentModelOf<T>>,
    context: SystemContentFactoryContext,
) => Result<ContentOf<T>, Error>;

export type SystemContentFactoryContext = {
    scene: Scene;
};
