//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "../styles/index.scss";

import { CosmosJourneyer } from "./cosmosJourneyer";
import { getForwardDirection, getRotationQuaternion, setRotationQuaternion, translate } from "./uberCore/transforms/basicTransform";
import { decodeBase64 } from "./utils/base64";
import { isJsonStringValidUniverseCoordinates } from "./saveFile/universeCoordinates";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

const urlParams = new URLSearchParams(window.location.search);
const universeCoordinatesString = urlParams.get("universeCoordinates");

if(universeCoordinatesString !== null) {
    const jsonString = decodeBase64(universeCoordinatesString);
    if(!isJsonStringValidUniverseCoordinates(jsonString)) {
        alert("Invalid universe coordinates");
    }
    engine.loadUniverseCoordinates(JSON.parse(jsonString));
} else {
    engine.init(false);
}

const shipControls = starSystemView.getSpaceshipControls();
const characterController = starSystemView.getCharacterControls();

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;

    if (e.key === "y") {
        if (starSystemView.scene.getActiveController() === shipControls) {
            console.log("disembark");

            characterController.getTransform().setEnabled(true);
            characterController.getTransform().setAbsolutePosition(shipControls.getTransform().absolutePosition);
            translate(characterController.getTransform(), getForwardDirection(shipControls.getTransform()).scale(10));

            setRotationQuaternion(characterController.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());

            starSystemView.scene.setActiveController(characterController);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        } else if (starSystemView.scene.getActiveController() === characterController) {
            console.log("embark");

            characterController.getTransform().setEnabled(false);
            starSystemView.scene.setActiveController(shipControls);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        }
    }
});
