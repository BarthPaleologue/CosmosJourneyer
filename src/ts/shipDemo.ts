import "../styles/index.scss";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { ShipController } from "./controllers/shipController";
import { positionNearBody } from "./utils/positionNearBody";
import { PlanetEngine } from "./planetEngine";

const engine = new PlanetEngine();

await engine.setup();

const scene = engine.getScene();

const mouse = new Mouse(engine.canvas, 1e5);

const spaceshipController = new ShipController(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.inputs.push(new Keyboard(), mouse, new Gamepad());

scene.setActiveController(spaceshipController);

const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
const starSystem = new StarSystem(starSystemSeed, scene);
engine.setStarSystem(starSystem);

starSystem.makeStars(1);
const planet = starSystem.makeTelluricPlanet();

document.addEventListener("keydown", (e) => {
    if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
    if (e.key == "f") spaceshipController.flightAssistEnabled = !spaceshipController.flightAssistEnabled;
});

engine.init();

positionNearBody(spaceshipController, planet, starSystem);