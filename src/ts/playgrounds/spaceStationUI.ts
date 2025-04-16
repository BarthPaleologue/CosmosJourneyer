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
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { getLoneStarSystem } from "../starSystem/customSystems/loneStar";
import { SpaceStationLayer } from "../ui/spaceStation/spaceStationLayer";
import { Player } from "../player/player";
import { EncyclopaediaGalacticaManager } from "../society/encyclopaediaGalacticaManager";
import { initI18n } from "../i18n";
import { Assets } from "../assets/assets";
import { enablePhysics } from "./utils";
import { Spaceship } from "../spaceship/spaceship";
import { ShipControls } from "../spaceship/shipControls";
import { SoundPlayerMock } from "../audio/soundPlayer";
import { TtsMock } from "../audio/tts";
import { loadSounds } from "../assets/sounds";

export async function createSpaceStationUIScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    await initI18n();

    await Assets.Init(scene);

    const sounds = await loadSounds(
        () => {},
        () => {}
    );

    const soundPlayer = new SoundPlayerMock();
    const tts = new TtsMock();

    const systemDatabase = new StarSystemDatabase(getLoneStarSystem());

    const player = Player.Default(systemDatabase);

    const serializedSpaceship = player.serializedSpaceships.shift();
    if (serializedSpaceship === undefined) {
        throw new Error("No spaceship found in player data");
    }

    const spaceship = Spaceship.Deserialize(serializedSpaceship, player.spareSpaceshipComponents, scene, sounds);
    player.instancedSpaceships.push(spaceship);

    const shipControls = new ShipControls(spaceship, scene, soundPlayer, tts);

    const camera = shipControls.thirdPersonCamera;
    camera.attachControl();
    scene.activeCamera = camera;

    const systemModel = systemDatabase.fallbackSystem;

    const encyclopaedia = new EncyclopaediaGalacticaManager();

    const spaceStationUI = new SpaceStationLayer(player, encyclopaedia, systemDatabase, soundPlayer);

    const stationModel = systemModel.orbitalFacilities[0];

    spaceStationUI.setStation(stationModel, [], player);
    spaceStationUI.setVisibility(true);

    return scene;
}
