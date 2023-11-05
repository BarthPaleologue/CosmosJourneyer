import "../styles/index.scss";
import { Keyboard } from "./controller/inputs/keyboard";
import { Mouse } from "./controller/inputs/mouse";
import { Gamepad } from "./controller/inputs/gamepad";
import { StarSystem } from "./controller/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { DefaultController } from "./spacelegs/defaultController";
import { positionNearObject } from "./utils/positionNearObject";
import { SpaceEngine } from "./controller/spaceEngine";
import { ShipController } from "./spaceship/shipController";
import { getRotationQuaternion, setRotationQuaternion } from "./controller/uberCore/transforms/basicTransform";
import { parsePercentageFrom01, parseSpeed } from "./utils/parseToStrings";
import { StarSystemHelper } from "./controller/starSystemHelper";

const engine = new SpaceEngine();

await engine.setup();

const scene = engine.getStarSystemScene();

const mouse = new Mouse(engine.canvas, 100);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const player = new DefaultController(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
player.addInput(keyboard);
player.addInput(mouse);
player.addInput(gamepad);

const spaceshipController = new ShipController(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(mouse);
spaceshipController.addInput(gamepad);

scene.setActiveController(spaceshipController);

engine.registerStarSystemUpdateCallback(() => {
    if (engine.isPaused()) return;
    if (scene.getActiveController() != spaceshipController) return;

    const shipPosition = spaceshipController.getTransform().getAbsolutePosition();
    const nearestBody = engine.getStarSystem().getNearestOrbitalObject();
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

const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
const starSystem = new StarSystem(starSystemSeed, scene);
engine.setStarSystem(starSystem, false);

const BH = StarSystemHelper.makeBlackHole(starSystem, 0);
BH.model.orbit.radius = 0;

const planet = StarSystemHelper.makeTelluricPlanet(starSystem);
planet.model.orbit.radius = 45 * planet.getRadius();

document.addEventListener("keydown", (e) => {
    if (e.key === "g") {
        if (scene.getActiveController() === spaceshipController) {
            scene.setActiveController(player);
            setRotationQuaternion(player.getTransform(), getRotationQuaternion(spaceshipController.getTransform()).clone());
            engine.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(false, engine.getHavokPlugin());
        } else {
            scene.setActiveController(spaceshipController);
            setRotationQuaternion(spaceshipController.getTransform(), getRotationQuaternion(player.getTransform()).clone());
            engine.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(true, engine.getHavokPlugin());
        }
    }
});

engine.init();

positionNearObject(scene.getActiveController(), BH, starSystem, 20);

engine.toggleStarMap();
