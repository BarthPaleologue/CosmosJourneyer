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
player.addInput(mouse);
player.addInput(gamepad);

const shipControls = new ShipControls(scene);
shipControls.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
shipControls.addInput(keyboard);
shipControls.addInput(mouse);
shipControls.addInput(gamepad);

scene.setActiveController(shipControls);

engine.registerStarSystemUpdateCallback(() => {
    if (scene.getActiveController() != shipControls) return;

    const shipPosition = shipControls.getTransform().getAbsolutePosition();
    const nearestBody = starSystemView.getStarSystem().getNearestOrbitalObject();
    const distance = nearestBody.getTransform().getAbsolutePosition().subtract(shipPosition).length();
    const radius = nearestBody.getBoundingRadius();
    shipControls.spaceship.registerClosestObject(distance, radius);

    const warpDrive = shipControls.spaceship.getWarpDrive();
    const shipInternalThrottle = warpDrive.getInternalThrottle();
    const shipTargetThrottle = warpDrive.getTargetThrottle();

    const throttleString = warpDrive.isEnabled()
        ? `${parsePercentageFrom01(shipInternalThrottle)}/${parsePercentageFrom01(shipTargetThrottle)}`
        : `${parsePercentageFrom01(shipControls.spaceship.getThrottle())}/100%`;

    (document.querySelector("#speedometer") as HTMLElement).innerHTML = `${throttleString} | ${parseSpeed(shipControls.spaceship.getSpeed())}`;
});

const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
const starSystem = new StarSystemController(starSystemSeed, scene);
starSystemView.setStarSystem(starSystem, false);

const BH = StarSystemHelper.makeBlackHole(starSystem, 0);
BH.model.orbit.radius = 0;

const planet = StarSystemHelper.makeTelluricPlanet(starSystem);
planet.model.orbit.radius = 45 * planet.getRadius();

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;
    if (e.key === "g") {
        if (scene.getActiveController() === shipControls) {
            scene.setActiveController(player);
            setRotationQuaternion(player.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            shipControls.spaceship.setEnabled(false, engine.getHavokPlugin());
        } else {
            scene.setActiveController(shipControls);
            setRotationQuaternion(shipControls.getTransform(), getRotationQuaternion(player.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            shipControls.spaceship.setEnabled(true, engine.getHavokPlugin());
        }
    }
});

engine.init();

positionNearObject(scene.getActiveController(), BH, starSystem, 20);

engine.toggleStarMap();
