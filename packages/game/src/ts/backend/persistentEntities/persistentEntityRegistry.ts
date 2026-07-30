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

import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { serializeStarSystemCoordinates } from "@cosmos-journeyer/universe-model";
import type { StarSystemCoordinates } from "@cosmos-journeyer/universe-model";

import type { PersistentEntityModel } from "./persistentEntityModel";

export class PersistentEntityRegistry {
    private readonly registry: Map<string, Array<DeepReadonly<PersistentEntityModel>>> = new Map();

    register(starSystemCoordinates: StarSystemCoordinates, entityModels: DeepReadonly<Array<PersistentEntityModel>>) {
        const systemKey = serializeStarSystemCoordinates(starSystemCoordinates);

        const existingEntities = this.registry.get(systemKey) ?? [];
        existingEntities.push(...entityModels);

        this.registry.set(systemKey, existingEntities);
    }

    get(starSystemCoordinates: StarSystemCoordinates) {
        const systemKey = serializeStarSystemCoordinates(starSystemCoordinates);
        return this.registry.get(systemKey);
    }
}
