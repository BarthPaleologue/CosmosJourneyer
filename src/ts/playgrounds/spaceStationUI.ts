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

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { TtsMock } from "@/frontend/audio/tts";
import { ShipControls } from "@/frontend/spaceship/shipControls";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import { SpaceStationLayer } from "@/frontend/ui/spaceStation/spaceStationLayer";

import { initI18n } from "@/i18n";

import { Player } from "../frontend/player/player";
import { enablePhysics } from "./utils";

export async function createSpaceStationUIScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    await initI18n();

    const assets = await loadRenderingAssets((current, total, name) => {
        progressCallback(current / total, `Loading ${name}`);
    }, scene);

    const soundPlayer = new SoundPlayerMock();
    const tts = new TtsMock();

    const systemDatabase = new StarSystemDatabase(getLoneStarSystem());

    const player = Player.Default(systemDatabase);

    const serializedSpaceship = player.serializedSpaceships.shift();
    if (serializedSpaceship === undefined) {
        throw new Error("No spaceship found in player data");
    }

    const spaceship = Spaceship.Deserialize(
        serializedSpaceship,
        player.spareSpaceshipComponents,
        scene,
        assets,
        soundPlayer,
    );
    player.instancedSpaceships.push(spaceship);

    const shipControls = new ShipControls(spaceship, scene, soundPlayer, tts);

    const camera = shipControls.thirdPersonCamera;
    camera.attachControl();
    scene.activeCamera = camera;

    const systemModel = systemDatabase.fallbackSystem;

    const encyclopaedia = new EncyclopaediaGalacticaManager();

    const spaceStationUI = new SpaceStationLayer(player, encyclopaedia, systemDatabase, soundPlayer);

    const stationModel = systemModel.orbitalFacilities[0];
    if (stationModel === undefined) {
        throw new Error("No station found in system model");
    }

    spaceStationUI.setStation(stationModel, [], player);
    spaceStationUI.setVisibility(true);

    return scene;
}
