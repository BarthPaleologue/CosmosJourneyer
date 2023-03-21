import "../styles/index.scss";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { ShipController } from "./spaceship/shipController";
import { positionNearBody } from "./utils/positionNearBody";
import { PlanetEngine } from "./planetEngine";
import { BODY_TYPE } from "./descriptors/common";
import { EditorVisibility } from "./ui/bodyEditor/bodyEditor";

const engine = new PlanetEngine();

await engine.setup();

const scene = engine.getScene();

const mouse = new Mouse(engine.canvas, 1e5);

const spaceshipController = new ShipController(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(new Keyboard());
spaceshipController.addInput(new Gamepad());

scene.setActiveController(spaceshipController);

engine.registerUpdateCallback(() => {
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
engine.setStarSystem(starSystem);

starSystem.generate();

engine.init();

const nbRadius = starSystem.descriptor.getBodyTypeOfStar(0) == BODY_TYPE.BLACK_HOLE ? 8 : 2;
positionNearBody(spaceshipController, starSystem.planets.length > 0 ? starSystem.getBodies()[1] : starSystem.stellarObjects[0], starSystem, nbRadius);

engine.bodyEditor.setVisibility(EditorVisibility.NAVBAR);