//  This file is part of CosmosJourneyer
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
import { StarSystemController } from "./starSystem/starSystemController";
import { SystemSeed } from "./utils/systemSeed";

const engine = new CosmosJourneyer();

await engine.setup();

const starSystemView = engine.getStarSystemView();

//const starSystem = new StarSystemController(new SystemSeed(0, 0, 0, 0), starSystemView.scene);
//starSystemView.setStarSystem(starSystem, true);

engine.init();

const spaceshipController = starSystemView.getSpaceshipControls();
const characterController = starSystemView.getCharacterControls();
const defaultController = starSystemView.getDefaultControls();

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;

    if (e.key === "y") {
        if (starSystemView.scene.getActiveController() === spaceshipController) {
            console.log("disembark");

            characterController.getTransform().setEnabled(true);
            characterController.getTransform().setAbsolutePosition(spaceshipController.getTransform().absolutePosition);
            translate(characterController.getTransform(), getForwardDirection(spaceshipController.getTransform()).scale(10));

            setRotationQuaternion(characterController.getTransform(), getRotationQuaternion(spaceshipController.getTransform()).clone());

            starSystemView.scene.setActiveController(characterController);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        } else if (starSystemView.scene.getActiveController() === characterController) {
            console.log("embark");

            characterController.getTransform().setEnabled(false);
            starSystemView.scene.setActiveController(spaceshipController);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        }
    }

    if (e.key === "g") {
        const scene = starSystemView.scene;
        if (scene.getActiveController() === spaceshipController) {
            starSystemView.switchToDefaultControls();
        } else if (scene.getActiveController() === defaultController) {
            starSystemView.switchToSpaceshipControls();
        } else if (scene.getActiveController() === characterController) {
            starSystemView.switchToCharacterControls();
        }
    }
});
