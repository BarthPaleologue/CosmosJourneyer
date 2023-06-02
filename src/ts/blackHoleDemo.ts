import "../styles/index.scss";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { PlayerController } from "./spacelegs/playerController";
import { positionNearObject } from "./utils/positionNearObject";
import { PlanetEngine } from "./planetEngine";
import { ShipController } from "./spaceship/shipController";
import { EditorVisibility } from "./ui/bodyEditor/bodyEditor";

const engine = new PlanetEngine();

await engine.setup();

const scene = engine.getStarSystemScene();

const mouse = new Mouse(engine.canvas, 1e5);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const player = new PlayerController(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
player.addInput(keyboard);
player.addInput(mouse);
player.addInput(gamepad);

const spaceshipController = new ShipController(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(gamepad);

scene.setActiveController(spaceshipController);

engine.registerStarSystemUpdateCallback(() => {
    if (scene.getActiveController() != spaceshipController) return;

    const shipPosition = spaceshipController.transform.getAbsolutePosition();
    const nearestBody = engine.getStarSystem().getNearestBody(shipPosition);
    const distance = nearestBody.transform.getAbsolutePosition().subtract(shipPosition).length();
    const radius = nearestBody.getRadius();
    spaceshipController.registerClosestDistanceToPlanet(distance - radius);
});

const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
const starSystem = new StarSystem(starSystemSeed, scene);
engine.setStarSystem(starSystem, false);

const BH = starSystem.makeBlackHole(0);
BH.descriptor.orbitalProperties.periapsis = BH.getRadius() * 4;
BH.descriptor.orbitalProperties.apoapsis = BH.getRadius() * 4;

const planet = starSystem.makeTelluricPlanet();
planet.descriptor.orbitalProperties.periapsis = 10000e3;
planet.descriptor.orbitalProperties.apoapsis = 10000e3;

document.addEventListener("keydown", (e) => {
    if (e.key === "g") {
        if (scene.getActiveController() === spaceshipController) {
            scene.setActiveController(player);
            player.transform.setRotationQuaternion(spaceshipController.transform.getRotationQuaternion().clone());
            engine.getStarSystem().postProcessManager.rebuild(spaceshipController.getActiveCamera());
            spaceshipController.setHidden(true);
        } else {
            scene.setActiveController(spaceshipController);
            spaceshipController.transform.setRotationQuaternion(player.transform.getRotationQuaternion().clone());
            engine.getStarSystem().postProcessManager.rebuild(player.getActiveCamera());
            spaceshipController.setHidden(false);
        }
    }
});

engine.init();

positionNearObject(scene.getActiveController(), BH, starSystem, 20);

engine.bodyEditor.setVisibility(EditorVisibility.FULL);