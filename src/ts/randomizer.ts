import "../styles/index.scss";
import { Keyboard } from "./controller/inputs/keyboard";
import { Mouse } from "./controller/inputs/mouse";
import { Gamepad } from "./controller/inputs/gamepad";
import { StarSystem } from "./controller/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { PlayerController } from "./spacelegs/playerController";
import { positionNearObject } from "./utils/positionNearObject";
import { PlanetEngine } from "./controller/planetEngine";
import { BODY_TYPE } from "./model/common";
import { ShipController } from "./spaceship/shipController";
import { EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { getRotationQuaternion, setRotationQuaternion } from "./controller/uberCore/transforms/basicTransform";

const engine = new PlanetEngine();

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

const nbRadius = starSystem.model.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 3;
positionNearObject(scene.getActiveController(), starSystem.planets.length > 0 ? starSystem.getBodies()[1] : starSystem.stellarObjects[0], starSystem, nbRadius);

engine.bodyEditor.setVisibility(EditorVisibility.NAVBAR);
