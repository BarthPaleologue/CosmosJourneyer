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

import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import type { StarSystemModel } from "@cosmos-journeyer/universe-model";

import { EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { getChronosSystemModel } from "@/backend/universe/customSystems/chronos";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { TtsMock } from "@/frontend/audio/tts";
import { positionNearObjectBrightSide } from "@/frontend/helpers/positionNearObject";
import { Player } from "@/frontend/player/player";
import { StarSystemView } from "@/frontend/starSystemView";
import { NotificationManagerMock, type INotificationManager } from "@/frontend/ui/notificationManager";
import { ChunkForgeWorkers } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";

import { initI18n } from "@/i18n";
import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createCustomSystemScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    await initI18n();

    const urlParams = new URLSearchParams(window.location.search);
    const systemKey = urlParams.get("system");

    let systemModel: StarSystemModel;
    if (systemKey === "chronos") {
        systemModel = getChronosSystemModel();
    } else {
        systemModel = getLoneStarSystem();
    }

    const universeBackend = new UniverseBackend(systemModel);

    const player = Player.Default(universeBackend);

    const encyclopaediaManager = new EncyclopaediaGalacticaManager();

    const soundPlayerMock = new SoundPlayerMock();

    const ttsMock = new TtsMock();
    const notificationManager: INotificationManager = new NotificationManagerMock();

    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    const havokPlugin = await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);
    const chunkForgeResult = await ChunkForgeWorkers.New(Settings.VERTEX_RESOLUTION);
    if (!chunkForgeResult.success) {
        throw chunkForgeResult.error;
    }
    const chunkForge = chunkForgeResult.value;

    const starSystemView = new StarSystemView(
        scene,
        player,
        engine,
        havokPlugin,
        encyclopaediaManager,
        universeBackend,
        soundPlayerMock,
        ttsMock,
        notificationManager,
        assets,
        chunkForge,
        progressMonitor,
    );

    await starSystemView.resetPlayer();

    await starSystemView.switchToSpaceshipControls();

    await starSystemView.loadStarSystem(universeBackend.fallbackSystem);

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
