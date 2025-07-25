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
import { type Scene } from "@babylonjs/core/scene";

import { EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { getAlphaTestisSystemModel } from "@/backend/universe/customSystems/alphaTestis";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { TtsMock } from "@/frontend/audio/tts";
import { Player } from "@/frontend/player/player";
import { StarSystemView } from "@/frontend/starSystemView";
import { UberScene } from "@/frontend/uberCore/uberScene";
import { updateNotifications } from "@/frontend/ui/notification";

import { positionNearObjectBrightSide } from "@/utils/positionNearObject";

import { initI18n } from "@/i18n";

import { enablePhysics } from "./utils";

export async function createStarSystemViewScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    await initI18n();

    const starSystemDatabase = new StarSystemDatabase(getAlphaTestisSystemModel());

    const player = Player.Default(starSystemDatabase);

    const encyclopaediaManager = new EncyclopaediaGalacticaManager();

    const soundPlayerMock = new SoundPlayerMock();

    const ttsMock = new TtsMock();

    const scene = new UberScene(engine);
    scene.useRightHandedSystem = true;

    const havokPlugin = await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const starSystemView = new StarSystemView(
        scene,
        player,
        engine,
        havokPlugin,
        encyclopaediaManager,
        starSystemDatabase,
        soundPlayerMock,
        ttsMock,
        assets,
    );

    await starSystemView.resetPlayer();

    await starSystemView.switchToSpaceshipControls();

    await starSystemView.loadStarSystem(starSystemDatabase.fallbackSystem);

    starSystemView.initStarSystem();

    positionNearObjectBrightSide(
        starSystemView.getSpaceshipControls(),
        starSystemView.getStarSystem().getStellarObjects()[0],
        starSystemView.getStarSystem(),
    );

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        updateNotifications(deltaSeconds);
    });

    return starSystemView.scene;
}
