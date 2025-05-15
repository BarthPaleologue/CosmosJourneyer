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

import { FreeCamera, Vector3 } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { SoundPlayerMock } from "../audio/soundPlayer";
import { TutorialLayer } from "../frontend/ui/tutorial/tutorialLayer";
import { initI18n } from "../i18n";
import { FlightTutorial } from "../tutorials/flightTutorial";
import { FuelScoopTutorial } from "../tutorials/fuelScoopTutorial";
import { StarMapTutorial } from "../tutorials/starMapTutorial";
import { StationLandingTutorial } from "../tutorials/stationLandingTutorial";

export async function createTutorialScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);

    // This creates and positions a free camera (non-mesh)
    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl();

    await initI18n();

    const tutorialLayer = new TutorialLayer(new SoundPlayerMock());
    document.body.appendChild(tutorialLayer.root);

    const urlParams = new URLSearchParams(window.location.search);
    const requestedTutorial = urlParams.get("tutorial") ?? "flight";

    switch (requestedTutorial) {
        case "flight":
            await tutorialLayer.setTutorial(new FlightTutorial());
            break;
        case "fuelScoop":
            await tutorialLayer.setTutorial(new FuelScoopTutorial());
            break;
        case "stationLanding":
            await tutorialLayer.setTutorial(new StationLandingTutorial());
            break;
        case "starMap":
            await tutorialLayer.setTutorial(new StarMapTutorial());
            break;
    }

    progressCallback(1, "Loaded tutorial");

    return scene;
}
