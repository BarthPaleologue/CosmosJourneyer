import "../styles/index.scss";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { PlayerController } from "./controllers/playerController";
import { positionNearBody } from "./utils/positionNearBody";
import { PlanetEngine } from "./planetEngine";

const engine = new PlanetEngine();

await engine.setup();

const scene = engine.getScene();

const mouse = new Mouse(engine.canvas, 1e5);

const playerController = new PlayerController(scene);
playerController.speed = 0.2 * Settings.EARTH_RADIUS;
playerController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
playerController.inputs.push(new Keyboard(), mouse, new Gamepad());

scene.setActiveController(playerController);

const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
const starSystem = new StarSystem(starSystemSeed, scene);
engine.setStarSystem(starSystem);

const BH = starSystem.makeBlackHole(0);
BH.orbitalProperties.periapsis = BH.getRadius() * 4;
BH.orbitalProperties.apoapsis = BH.getRadius() * 4;

const planet = starSystem.makeTelluricPlanet();
planet.descriptor.orbitalProperties.periapsis = 10000e3;
planet.descriptor.orbitalProperties.apoapsis = 10000e3;

document.addEventListener("keydown", (e) => {
    if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
});

engine.init();

positionNearBody(playerController, BH, starSystem, 20);