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

import { Axis, Space } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { type Scene } from "@babylonjs/core/scene";
import { EncyclopaediaGalacticaManager } from "@cosmos-journeyer/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { getAlphaTestisSystemModel } from "@cosmos-journeyer/backend/universe/customSystems/alphaTestis";
import { StarSystemDatabase } from "@cosmos-journeyer/backend/universe/starSystemDatabase";
import { type ILoadingProgressMonitor } from "@cosmos-journeyer/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@cosmos-journeyer/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@cosmos-journeyer/frontend/audio/soundPlayer";
import { TtsMock } from "@cosmos-journeyer/frontend/audio/tts";
import { positionNearObjectBrightSide } from "@cosmos-journeyer/frontend/helpers/positionNearObject";
import { UberScene } from "@cosmos-journeyer/frontend/helpers/uberScene";
import { Player } from "@cosmos-journeyer/frontend/player/player";
import { StarSystemView } from "@cosmos-journeyer/frontend/starSystemView";
import { updateNotifications } from "@cosmos-journeyer/frontend/ui/notification";

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
    starSystemView.getSpaceshipControls().getTransform().rotate(Axis.Y, Math.PI, Space.LOCAL);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        updateNotifications(deltaSeconds);
    });

    return starSystemView.scene;
}
