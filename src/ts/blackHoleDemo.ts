import "../styles/index.scss";
import { Keyboard } from "./controller/inputs/keyboard";
import { Mouse } from "./controller/inputs/mouse";
import { Gamepad } from "./controller/inputs/gamepad";
import { StarSystem } from "./controller/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { PlayerController } from "./spacelegs/playerController";
import { positionNearObject } from "./utils/positionNearObject";
import { SpaceEngine } from "./controller/spaceEngine";
import { ShipController } from "./spaceship/shipController";
import { EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { getRotationQuaternion, setRotationQuaternion } from "./controller/uberCore/transforms/basicTransform";
import { parsePercentageFrom01, parseSpeed } from "./utils/parseToStrings";

const engine = new SpaceEngine();

await engine.setup();

const scene = engine.getStarSystemScene();

const mouse = new Mouse(engine.canvas, 100);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const player = new PlayerController(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
player.addInput(keyboard);
player.addInput(mouse);
player.addInput(gamepad);
player.setEnabled(false, engine.getHavokPlugin());

const spaceshipController = new ShipController(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(mouse);
spaceshipController.addInput(gamepad);

scene.setActiveController(spaceshipController);

engine.registerStarSystemUpdateCallback(() => {
    if (scene.getActiveController() != spaceshipController) return;

    const shipPosition = spaceshipController.aggregate.transformNode.getAbsolutePosition();
    const nearestBody = engine.getStarSystem().getNearestBody(shipPosition);
    const distance = nearestBody.transform.getAbsolutePosition().subtract(shipPosition).length();
    const radius = nearestBody.getRadius();
    spaceshipController.registerClosestObject(distance, radius);

    const warpDrive = spaceshipController.getWarpDrive();
    const shipInternalThrottle = warpDrive.getInternalThrottle();
    const shipTargetThrottle = warpDrive.getTargetThrottle();

    const throttleString = warpDrive.isEnabled() ? `${parsePercentageFrom01(shipInternalThrottle)}/${parsePercentageFrom01(shipTargetThrottle)}` : spaceshipController.getThrottle();

    (document.querySelector("#speedometer") as HTMLElement).innerHTML = `${throttleString} | ${parseSpeed(spaceshipController.getSpeed())}`;
});

const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
const starSystem = new StarSystem(starSystemSeed, scene);
engine.setStarSystem(starSystem, false);

const BH = starSystem.makeBlackHole(0);
BH.model.orbitalProperties.periapsis = BH.getRadius() * 4;
BH.model.orbitalProperties.apoapsis = BH.getRadius() * 4;

const planet = starSystem.makeTelluricPlanet();
planet.model.orbitalProperties.periapsis = 10000e3;
planet.model.orbitalProperties.apoapsis = 10000e3;

document.addEventListener("keydown", (e) => {
    if (e.key === "g") {
        if (scene.getActiveController() === spaceshipController) {
            scene.setActiveController(player);
            setRotationQuaternion(player.aggregate.transformNode, getRotationQuaternion(spaceshipController.aggregate.transformNode).clone());
            engine.getStarSystem().postProcessManager.rebuild(spaceshipController.getActiveCamera());

            spaceshipController.setEnabled(false, engine.getHavokPlugin());
            player.setEnabled(true, engine.getHavokPlugin());
        } else {
            scene.setActiveController(spaceshipController);
            setRotationQuaternion(spaceshipController.aggregate.transformNode, getRotationQuaternion(player.aggregate.transformNode).clone());
            engine.getStarSystem().postProcessManager.rebuild(player.getActiveCamera());

            player.setEnabled(false, engine.getHavokPlugin());
            spaceshipController.setEnabled(true, engine.getHavokPlugin());
        }
    }
});

engine.init();

positionNearObject(scene.getActiveController(), BH, starSystem, 20);
