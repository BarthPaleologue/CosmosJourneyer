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

import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { GameModuleApi } from "@/modules/gameModuleApi";

import type { SystemEntityLoader } from "./systemEntity/systemEntityLoader";
import type { SystemEntityProcessors } from "./systemEntity/systemEntityProcessors";

export function createGameModuleApi(
    universeBackend: UniverseBackend,
    systemEntityLoader: SystemEntityLoader,
    systemEntityProcessors: SystemEntityProcessors,
): GameModuleApi {
    return {
        starSystems: {
            registerAuthored: (model) => {
                universeBackend.registerAuthoredSystem(model);
            },
        },
        systemEntities: {
            registerAuthored: (coordinates, models) => {
                universeBackend.registerAuthoredEntities(coordinates, models);
            },
            registerProcedural: (factory) => {
                universeBackend.registerProceduralEntities(factory);
            },
            registerContentFactory: (type, factory) => {
                systemEntityLoader.registerFactory(type, factory);
            },
            registerUpdate: (type, update) => {
                systemEntityProcessors.registerUpdate(type, update);
            },
        },
    };
}
