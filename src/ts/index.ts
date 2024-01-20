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

import { Settings } from "./settings";
import { DefaultControls } from "./defaultController/defaultControls";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { ShipControls } from "./spaceship/shipControls";
import { getForwardDirection, getRotationQuaternion, setRotationQuaternion, translate } from "./uberCore/transforms/basicTransform";
import { parsePercentageFrom01, parseSpeed } from "./utils/parseToStrings";
import { Mouse } from "./inputs/mouse";
import { Keyboard } from "./inputs/keyboard";
import { Gamepad } from "./inputs/gamepad";
import { CharacterControls } from "./spacelegs/characterControls";
import { StarSystemController } from "./starSystem/starSystemController";
import { SystemSeed } from "./utils/systemSeed";

const engine = new CosmosJourneyer();

await engine.setup();

const starSystemView = engine.getStarSystemView();

const mouse = new Mouse(engine.canvas, 100);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const maxZ = Settings.EARTH_RADIUS * 1e5;

const defaultController = new DefaultControls(starSystemView.scene);
defaultController.speed = 0.2 * Settings.EARTH_RADIUS;
defaultController.getActiveCamera().maxZ = maxZ;
defaultController.addInput(keyboard);
defaultController.addInput(gamepad);

const spaceshipController = new ShipControls(starSystemView.scene);
spaceshipController.getActiveCamera().maxZ = maxZ;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(gamepad);
spaceshipController.addInput(mouse);

const characterController = new CharacterControls(starSystemView.scene);
characterController.getTransform().setEnabled(false);
characterController.getActiveCamera().maxZ = maxZ;
characterController.addInput(keyboard);
characterController.addInput(gamepad);

// const physicsViewer = new PhysicsViewer();
// physicsViewer.showBody(spaceshipController.aggregate.body);

mouse.onMouseLeaveObservable.add(() => {
    if (starSystemView.scene.getActiveController() === spaceshipController) engine.pause();
});

starSystemView.scene.setActiveController(spaceshipController);

engine.registerStarSystemUpdateCallback(() => {
    if (starSystemView.scene.getActiveController() != spaceshipController) return;

    const shipPosition = spaceshipController.getTransform().getAbsolutePosition();
    const nearestBody = starSystemView.getStarSystem().getNearestOrbitalObject();
    const distance = nearestBody.getTransform().getAbsolutePosition().subtract(shipPosition).length();
    const radius = nearestBody.getBoundingRadius();
    spaceshipController.registerClosestObject(distance, radius);

    const warpDrive = spaceshipController.getWarpDrive();
    const shipInternalThrottle = warpDrive.getInternalThrottle();
    const shipTargetThrottle = warpDrive.getTargetThrottle();

    const throttleString = warpDrive.isEnabled()
        ? `${parsePercentageFrom01(shipInternalThrottle)}/${parsePercentageFrom01(shipTargetThrottle)}`
        : `${parsePercentageFrom01(spaceshipController.getThrottle())}/100%`;

    (document.querySelector("#speedometer") as HTMLElement).innerHTML = `${throttleString} | ${parseSpeed(spaceshipController.getSpeed())}`;

    characterController.setClosestWalkableObject(nearestBody);
    spaceshipController.setClosestWalkableObject(nearestBody);
});

engine.getStarMap().onWarpObservable.add(() => {
    spaceshipController.thirdPersonCamera.radius = 30;
});

engine.onToggleStarMapObservable.add((isStarMapOpen) => {
    if (!isStarMapOpen) spaceshipController.thirdPersonCamera.radius = 30;
});

const starSystem = new StarSystemController(new SystemSeed(0, 0, 0, 0), starSystemView.scene);
starSystemView.setStarSystem(starSystem, true);

engine.init();

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
            scene.setActiveController(defaultController);
            setRotationQuaternion(defaultController.getTransform(), getRotationQuaternion(spaceshipController.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(false, starSystemView.havokPlugin);
        } else if (scene.getActiveController() === defaultController) {
            characterController.getTransform().setEnabled(true);
            characterController.getTransform().setAbsolutePosition(defaultController.getTransform().absolutePosition);
            scene.setActiveController(characterController);
            setRotationQuaternion(characterController.getTransform(), getRotationQuaternion(defaultController.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(false, starSystemView.havokPlugin);
        } else if (scene.getActiveController() === characterController) {
            characterController.getTransform().setEnabled(false);
            scene.setActiveController(spaceshipController);
            setRotationQuaternion(spaceshipController.getTransform(), getRotationQuaternion(defaultController.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(true, starSystemView.havokPlugin);
        }
    }
});
