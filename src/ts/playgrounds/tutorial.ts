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

import { AssetsManager, FreeCamera, Vector3 } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { TutorialLayer } from "../ui/tutorial/tutorialLayer";
import { FlightTutorial } from "../tutorials/flightTutorial";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { getLoneStarSystem } from "../starSystem/customSystems/loneStar";
import { FuelScoopTutorial } from "../tutorials/fuelScoopTutorial";
import { StationLandingTutorial } from "../tutorials/stationLandingTutorial";
import { initI18n } from "../i18n";
import { Sounds } from "../assets/sounds";

export async function createTutorialScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);

    // This creates and positions a free camera (non-mesh)
    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl();

    await initI18n();

    const assetsManager = new AssetsManager(scene);
    Sounds.EnqueueTasks(assetsManager, scene);
    await assetsManager.loadAsync();

    const tutorialLayer = new TutorialLayer();
    document.body.appendChild(tutorialLayer.root);

    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());

    const urlParams = new URLSearchParams(window.location.search);
    const requestedTutorial = urlParams.get("tutorial") ?? "flight";

    switch (requestedTutorial) {
        case "flight":
            await tutorialLayer.setTutorial(new FlightTutorial(starSystemDatabase));
            break;
        case "fuelScoop":
            await tutorialLayer.setTutorial(new FuelScoopTutorial(starSystemDatabase));
            break;
        case "stationLanding":
            await tutorialLayer.setTutorial(new StationLandingTutorial(starSystemDatabase));
            break;
    }

    return scene;
}
