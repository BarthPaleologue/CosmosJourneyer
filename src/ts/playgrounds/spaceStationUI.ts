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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { newSeededSpaceStationModel } from "../spacestation/spaceStationModelGenerator";
import { Settings } from "../settings";
import { newSeededStarModel } from "../stellarObjects/star/starModelGenerator";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { getLoneStarSystem } from "../starSystem/customSystems/loneStar";
import { SpaceStationLayer } from "../ui/spaceStation/spaceStationLayer";
import { Player } from "../player/player";
import { EncyclopaediaGalacticaManager } from "../society/encyclopaediaGalacticaManager";
import { AssetsManager, FreeCamera } from "@babylonjs/core";
import { initI18n } from "../i18n";
import { Sounds } from "../assets/sounds";

export async function createSpaceStationUIScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await initI18n();

    const assetsManager = new AssetsManager(scene);
    Sounds.EnqueueTasks(assetsManager, scene);

    await assetsManager.loadAsync();

    const player = Player.Default();

    const serializedSpaceship = player.serializedSpaceships.shift();
    if (serializedSpaceship === undefined) {
        throw new Error("No spaceship found in player data");
    }

    const camera = new FreeCamera("camera", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl();
    scene.activeCamera = camera;

    const distanceToStar = Settings.AU;

    const coordinates = {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0
    };

    const systemDatabase = new StarSystemDatabase(getLoneStarSystem());
    const systemPosition = systemDatabase.getSystemGalacticPosition(coordinates);

    const sunModel = newSeededStarModel(420, "Untitled Star", []);

    const spaceStationModel = newSeededSpaceStationModel(
        Math.random() * Settings.SEED_HALF_RANGE,
        [sunModel],
        coordinates,
        systemPosition,
        [sunModel]
    );
    spaceStationModel.orbit.semiMajorAxis = distanceToStar;

    const encyclopaedia = new EncyclopaediaGalacticaManager();

    const spaceStationUI = new SpaceStationLayer(player, encyclopaedia, systemDatabase);

    spaceStationUI.setStation(spaceStationModel, [], player);
    spaceStationUI.setVisibility(true);

    return scene;
}
