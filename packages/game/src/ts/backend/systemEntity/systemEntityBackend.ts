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
import type { StarSystemCoordinates, StarSystemModel } from "@cosmos-journeyer/universe-model";

import type { SystemEntityModel } from "./systemEntityModel";

export type SystemEntityModelGenerator = (context: SystemEntityModelContext) => Array<SystemEntityModel>;

export type SystemEntityModelContext = DeepReadonly<{
    system: StarSystemModel;
}>;

export class SystemEntityBackend {
    private readonly systemToEntities: Map<string, Array<DeepReadonly<SystemEntityModel>>> = new Map();

    private readonly proceduralEntityGenerators: Array<SystemEntityModelGenerator> = [];

    registerAuthored(coordinates: StarSystemCoordinates, content: Iterable<DeepReadonly<SystemEntityModel>>) {
        const systemKey = serializeStarSystemCoordinates(coordinates);
        const existingModels = this.systemToEntities.get(systemKey) ?? [];
        existingModels.push(...content);
        this.systemToEntities.set(systemKey, existingModels);
    }

    registerProcedural(generator: SystemEntityModelGenerator) {
        this.proceduralEntityGenerators.push(generator);
    }

    getModels(starSystem: DeepReadonly<StarSystemModel>): DeepReadonly<Array<SystemEntityModel>> {
        const results: Array<DeepReadonly<SystemEntityModel>> = [];
        const systemKey = serializeStarSystemCoordinates(starSystem.coordinates);
        const authoredModels = this.systemToEntities.get(systemKey);
        if (authoredModels !== undefined) {
            results.push(...authoredModels);
        }

        const context: SystemEntityModelContext = { system: starSystem };

        for (const generator of this.proceduralEntityGenerators) {
            results.push(...generator(context));
        }

        return results;
    }
}
