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

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import type { ClusteredLightingRegion } from "@/frontend/helpers/clusteredLightingSystem";
import type { AnySystemContentType, SystemEntity } from "@/frontend/systemEntity/systemEntity";
import type { HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import type { Transformable } from "@/frontend/universe/architecture/transformable";

export type RenderingExtensionPoint = {
    shadows: {
        systemEntities: {
            registerShadowCasters<T extends AnySystemContentType>(
                type: T,
                getShadowCasters: (entity: SystemEntity<T>) => Array<TransformNode>,
            ): void;

            registerSphereOccluders<T extends AnySystemContentType>(
                type: T,
                getSphereOccluders: (entity: SystemEntity<T>) => Array<Transformable & HasBoundingSphere>,
            ): void;
        };
    };
    lighting: {
        systemEntities: {
            registerRegion<T extends AnySystemContentType>(
                type: T,
                getRegion: (entity: SystemEntity<T>) => ClusteredLightingRegion,
            ): void;
        };
    };
};
