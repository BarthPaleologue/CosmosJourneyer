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

import { StarSystemController } from "./starSystem/starSystemController";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { DefaultControls } from "./defaultController/defaultControls";
import { positionNearObject } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { ShipControls } from "./spaceship/shipControls";
import { getRotationQuaternion, setRotationQuaternion } from "./uberCore/transforms/basicTransform";
import { parsePercentageFrom01, parseSpeed } from "./utils/parseToStrings";
import { StarSystemHelper } from "./starSystem/starSystemHelper";
import { Mouse } from "./inputs/mouse";
import { Keyboard } from "./inputs/keyboard";
import { Gamepad } from "./inputs/gamepad";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SystemSeed } from "./utils/systemSeed";

const engine = new CosmosJourneyer();

await engine.setup();

const starSystemView = engine.getStarSystemView();

const scene = starSystemView.scene;

const mouse = new Mouse(engine.canvas, 100);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const player = new DefaultControls(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
player.addInput(keyboard);
player.addInput(gamepad);

const spaceshipController = new ShipControls(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(mouse);
spaceshipController.addInput(gamepad);

scene.setActiveController(spaceshipController);

engine.registerStarSystemUpdateCallback(() => {
    if (scene.getActiveController() != spaceshipController) return;

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
});

const starSystemSeed = new SystemSeed(Vector3.Zero(), 0);
const starSystem = new StarSystemController(starSystemSeed, scene);
starSystemView.setStarSystem(starSystem, false);

const BH = StarSystemHelper.makeBlackHole(starSystem, 0);
BH.model.orbit.radius = 0;

const planet = StarSystemHelper.makeTelluricPlanet(starSystem);
planet.model.orbit.radius = 45 * planet.getRadius();

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;
    if (e.key === "g") {
        if (scene.getActiveController() === spaceshipController) {
            scene.setActiveController(player);
            setRotationQuaternion(player.getTransform(), getRotationQuaternion(spaceshipController.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(false, engine.getHavokPlugin());
        } else {
            scene.setActiveController(spaceshipController);
            setRotationQuaternion(spaceshipController.getTransform(), getRotationQuaternion(player.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(true, engine.getHavokPlugin());
        }
    }
});

engine.init();

positionNearObject(scene.getActiveController(), BH, starSystem, 20);

engine.toggleStarMap();
