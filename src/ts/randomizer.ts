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
import { BodyType } from "./bodies/interfaces";

const engine = new PlanetEngine();

await engine.setup();

const scene = engine.getScene();

const mouse = new Mouse(engine.canvas, 1e5);

const player = new PlayerController(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
player.inputs.push(new Keyboard(), mouse, new Gamepad());

scene.setActiveController(player);

//check if url contains a seed
const urlParams = new URLSearchParams(window.location.search);
const seed = urlParams.get("seed");

const starSystem = new StarSystem(seed ? Number(seed) : randRange(-1, 1, (step: number) => Math.random(), 0) * Number.MAX_SAFE_INTEGER, scene);
engine.setStarSystem(starSystem);

starSystem.generate();

document.addEventListener("keydown", (e) => {
    if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
});

engine.init();

const nbRadius = starSystem.descriptor.getBodyTypeOfStar(0) == BodyType.BLACK_HOLE ? 8 : 3;
positionNearBody(player, starSystem.planets.length > 0 ? starSystem.getBodies()[1] : starSystem.stars[0], starSystem, nbRadius);
