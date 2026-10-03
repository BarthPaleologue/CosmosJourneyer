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

import type { ICosmosJourneyerBackend } from "@/backend";

import type { GameModuleApi } from "@/modules/gameModuleApi";
import type { ModuleAssetRegistry } from "@/modules/moduleAssetRegistry";

import type { Musics } from "./assets/audio/musics";
import type { SystemEntityMusicContext } from "./audio/musicSystem";
import type { SystemEntityLoader } from "./systemEntity/systemEntityLoader";
import type { SystemEntityProcessorRegistry } from "./systemEntity/systemEntityProcessor";
import type { Target } from "./targeting/target";

export function createGameModuleApi(
    backend: ICosmosJourneyerBackend,
    moduleAssetRegistry: ModuleAssetRegistry,
    systemEntityLoader: SystemEntityLoader,
    systemEntityProcessorRegistries: SystemEntityProcessorRegistries,
): GameModuleApi {
    return {
        starSystems: {
            registerAuthored: (model) => {
                backend.universe.registerCustomSystem(model);
            },
        },
        systemEntities: {
            registerAuthored: (coordinates, models) => {
                backend.systemEntity.registerAuthored(coordinates, models);
            },
            registerProcedural: (factory) => {
                backend.systemEntity.registerProcedural(factory);
            },
            registerContentFactory: (type, factory) => {
                systemEntityLoader.registerFactory(type, factory);
            },
        },
        assets: moduleAssetRegistry,
        music: {
            systemEntities: {
                register: (type, getMusics) => {
                    systemEntityProcessorRegistries.music.register(type, getMusics);
                },
            },
        },
        targeting: {
            systemEntities: {
                register: (type, factory) => {
                    systemEntityProcessorRegistries.targeting.register(type, factory);
                },
            },
        },
    };
}

export type SystemEntityProcessorRegistries = Readonly<{
    targeting: SystemEntityProcessorRegistry<void, Array<Target>>;
    music: SystemEntityProcessorRegistry<SystemEntityMusicContext, Array<keyof Musics>>;
}>;
