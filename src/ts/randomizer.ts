import "../styles/index.scss";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { PlayerController } from "./spacelegs/playerController";
import { positionNearBody } from "./utils/positionNearBody";
import { PlanetEngine } from "./planetEngine";
import { BODY_TYPE } from "./descriptors/common";
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

//check if url contains a seed
const urlParams = new URLSearchParams(window.location.search);
const seed = urlParams.get("seed");

const starSystem = new StarSystem(seed ? Number(seed) : randRange(-1, 1, (step: number) => Math.random(), 0) * Number.MAX_SAFE_INTEGER, scene);
engine.setStarSystem(starSystem, true);

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

const nbRadius = starSystem.descriptor.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 3;
positionNearBody(scene.getActiveController(), starSystem.planets.length > 0 ? starSystem.getBodies()[1] : starSystem.stellarObjects[0], starSystem, nbRadius);

engine.bodyEditor.setVisibility(EditorVisibility.NAVBAR);
