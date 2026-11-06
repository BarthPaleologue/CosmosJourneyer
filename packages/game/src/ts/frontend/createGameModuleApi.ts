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

import type { i18n } from "i18next";

import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { GameModuleApiFactory } from "@/modules/gameModuleApi";
import type { StarMapSystemInfoExtensionPoint } from "@/modules/starMapSystemInfo";

import type { SystemEntityLoader } from "./systemEntity/systemEntityLoader";
import type { SystemEntityProcessors } from "./systemEntity/systemEntityProcessors";

/**
 * Creates the API through which game modules register authored universe content.
 * @param universeBackend Backend that stores authored star systems and entities.
 * @param systemEntityLoader Registry for entity content factories.
 * @param systemEntityProcessors Registries for entity runtime processors.
 * @param starMapSystemInfo Registry for system information supplied by modules.
 * @param i18n Translation instance owned by the game.
 * @returns API factory that scopes translations to each module ID.
 */
export function createGameModuleApi(
    universeBackend: UniverseBackend,
    systemEntityLoader: SystemEntityLoader,
    systemEntityProcessors: SystemEntityProcessors,
    starMapSystemInfo: StarMapSystemInfoExtensionPoint,
    i18n: Pick<i18n, "addResourceBundle" | "getFixedT">,
): GameModuleApiFactory {
    return (moduleId) => ({
        i18n: {
            registerResources: (resources) => {
                for (const [language, translations] of Object.entries(resources)) {
                    i18n.addResourceBundle(language, `module/${moduleId}`, translations);
                }
            },
            t: i18n.getFixedT(null, `module/${moduleId}`),
        },
        starMapSystemInfo,
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
            registerSpatialGeometry: (type, getGeometry) => {
                systemEntityProcessors.spatialGeometry.register(type, getGeometry);
            },
            registerUpdate: (type, update) => {
                systemEntityProcessors.registerUpdate(type, update);
            },
        },
        music: {
            systemEntities: {
                register: (type, getMusics) => {
                    systemEntityProcessors.music.register(type, getMusics);
                },
            },
        },
        targeting: {
            systemEntities: {
                register: (type, factory) => {
                    systemEntityProcessors.targeting.register(type, factory);
                },
            },
        },
        rendering: {
            shadows: {
                systemEntities: {
                    registerShadowCasters: (type, getShadowCasters) => {
                        systemEntityProcessors.shadowCasters.register(type, getShadowCasters);
                    },
                    registerSphereOccluders: (type, getSphereOccluders) => {
                        systemEntityProcessors.sphereOccluders.register(type, getSphereOccluders);
                    },
                },
            },
            lighting: {
                systemEntities: {
                    registerRegion: (type, getRegion) => {
                        systemEntityProcessors.lightingRegions.register(type, getRegion);
                    },
                },
            },
        },
        landingPad: {
            systemEntities: {
                register: (type, getLandingPadProvider) => {
                    systemEntityProcessors.landingPadProviders.register(type, getLandingPadProvider);
                },
            },
        },
    });
}
