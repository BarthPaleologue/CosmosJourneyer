//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import type { StarSystemModel } from "@cosmos-journeyer/universe-model";

import { CosmosJourneyerBackendLocal } from "@/backend/backendLocal";
import { EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { getEclipseTestSystemModel } from "@/backend/universe/customSystems/eclipseTest";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { TtsMock } from "@/frontend/audio/tts";
import { createGameModuleApi } from "@/frontend/createGameModuleApi";
import { positionNearObjectBrightSide } from "@/frontend/helpers/positionNearObject";
import { Player } from "@/frontend/player/player";
import { StarSystemView } from "@/frontend/starSystemView";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";
import { NotificationManagerMock } from "@/frontend/ui/notificationManager";
import type { INotificationManager } from "@/frontend/ui/notificationManager";
import { TerrainSystemCpu } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystemCpu";

import { initI18n } from "@/i18n";
import { getChronosModel } from "@/modules/chronos/chronos";
import { getBuiltinModules, setupModules } from "@/modules/moduleLoader";
import { getVestaModel } from "@/modules/vesta/vesta";
import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createCustomSystemScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const t = await initI18n();

    const urlParams = new URLSearchParams(window.location.search);
    const systemKey = urlParams.get("system");

    const backendResult = await CosmosJourneyerBackendLocal.New();
    if (!backendResult.success) {
        throw backendResult.error;
    }

    const backend = backendResult.value;

    const systemEntityLoader = new SystemEntityLoader();
    const systemEntityProcessors = new SystemEntityProcessors();

    const gameModuleApi = createGameModuleApi(backend.universe, systemEntityLoader, systemEntityProcessors);
    const moduleSetupResult = setupModules(getBuiltinModules(), gameModuleApi);
    if (!moduleSetupResult.success) {
        throw moduleSetupResult.error;
    }

    let systemModel: StarSystemModel;
    if (systemKey === "chronos") {
        const chronos = getChronosModel();
        systemModel = chronos.systemModel;
    } else if (systemKey === "vesta") {
        const vesta = getVestaModel();
        systemModel = vesta.starSystem;
    } else if (systemKey === "eclipseTest") {
        systemModel = getEclipseTestSystemModel();
    } else {
        systemModel = getLoneStarSystem();
    }

    backend.universe.registerAuthoredSystem(systemModel);
    const systemContentModel = backend.universe.getSystemContentModelAt(systemModel.coordinates);
    if (systemContentModel === null) {
        throw new Error("Cannot find the registered custom system");
    }
    const entityModels = systemContentModel.entities;

    const player = Player.Default(backend.universe);

    const encyclopaediaManager = new EncyclopaediaGalacticaManager();

    const soundPlayerMock = new SoundPlayerMock();

    const ttsMock = new TtsMock();
    const notificationManager: INotificationManager = new NotificationManagerMock();

    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    const havokPlugin = await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);
    const terrainSystemResult = await TerrainSystemCpu.New(Settings.VERTEX_RESOLUTION);
    if (!terrainSystemResult.success) {
        throw terrainSystemResult.error;
    }
    const terrainSystem = terrainSystemResult.value;

    const starSystemView = new StarSystemView(
        scene,
        player,
        engine,
        havokPlugin,
        encyclopaediaManager,
        backend.universe,
        systemEntityLoader,
        systemEntityProcessors,
        soundPlayerMock,
        ttsMock,
        notificationManager,
        assets,
        terrainSystem,
        t,
        progressMonitor,
    );

    await starSystemView.resetPlayer(player);

    await starSystemView.switchToSpaceshipControls();

    const loadResult = await starSystemView.loadStarSystem({ system: systemModel, entities: entityModels });
    if (!loadResult.success) {
        throw loadResult.error;
    }

    starSystemView.initStarSystem(0);

    positionNearObjectBrightSide(
        starSystemView.getSpaceshipControls(),
        starSystemView.getStarSystem().getStellarObjects()[0],
        starSystemView.getStarSystem(),
    );

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        notificationManager.update(deltaSeconds);
    });

    return starSystemView.scene;
}
