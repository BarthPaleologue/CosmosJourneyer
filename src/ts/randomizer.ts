import "../styles/index.scss";

import { StarSystemController } from "./starSystem/starSystemController";

import { centeredRand, randRange } from "extended-random";
import { Settings } from "./settings";
import { DefaultControls } from "./defaultController/defaultControls";
import { positionNearObject } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { BODY_TYPE } from "./model/common";
import { ShipControls } from "./spaceship/shipControls";
import { EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { getRotationQuaternion, setRotationQuaternion } from "./uberCore/transforms/basicTransform";
import { parsePercentageFrom01, parseSpeed } from "./utils/parseToStrings";
import { Mouse } from "./inputs/mouse";
import { Keyboard } from "./inputs/keyboard";
import { Gamepad } from "./inputs/gamepad";
import { SystemSeed } from "./utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

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
player.addInput(gamepad);

const spaceshipController = new ShipControls(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(mouse);
spaceshipController.addInput(gamepad);

scene.setActiveController(spaceshipController);

engine.registerStarSystemUpdateCallback(() => {
    if (scene.getActiveController() != spaceshipController) return;

    const shipPosition = spaceshipController.getTransform().getAbsolutePosition();
    const nearestBody = starSystemView.getStarSystem().getNearestOrbitalObject();
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

engine.getStarMap().onWarpObservable.add(() => {
    spaceshipController.thirdPersonCamera.radius = 30;
});

engine.onToggleStarMapObservable.add((isStarMapOpen) => {
    if (!isStarMapOpen) spaceshipController.thirdPersonCamera.radius = 30;
});

//check if url contains a seed
const urlParams = new URLSearchParams(window.location.search);
const urlStarMapX = urlParams.get("starMapX");
const urlStarMapY = urlParams.get("starMapY");
const urlStarMapZ = urlParams.get("starMapZ");
const urlIndex = urlParams.get("index");
const urlBodyIndex = urlParams.get("bodyIndex");

const starMapX = urlStarMapX !== null ? Number(urlStarMapX) : Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const starMapY = urlStarMapY !== null ? Number(urlStarMapY) : Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const starMapZ = urlStarMapZ !== null ? Number(urlStarMapZ) : Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const index = urlIndex !== null ? Number(urlIndex) : 0;
const bodyIndex = urlBodyIndex !== null ? Number(urlBodyIndex) : 0;

const seed = new SystemSeed(new Vector3(starMapX, starMapY, starMapZ), index);

const starSystem = new StarSystemController(seed, scene);
starSystemView.setStarSystem(starSystem, true);

engine.getStarMap().setCurrentStarSystem(seed);

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;
    if (e.key === "g") {
        if (scene.getActiveController() === spaceshipController) {
            scene.setActiveController(player);
            setRotationQuaternion(player.getTransform(), getRotationQuaternion(spaceshipController.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(false, engine.getHavokPlugin());
        } else {
            scene.setActiveController(spaceshipController);
            setRotationQuaternion(spaceshipController.getTransform(), getRotationQuaternion(player.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            spaceshipController.setEnabled(true, engine.getHavokPlugin());
        }
    }
});

engine.init();

const nbRadius = starSystem.model.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 3;
if(bodyIndex >= starSystem.getBodies().length) throw new Error(`Body index (${bodyIndex}) out of bound (0 - ${starSystem.getBodies().length - 1})!`);
positionNearObject(scene.getActiveController(), starSystem.planets.length > 0 ? starSystem.getBodies()[bodyIndex] : starSystem.stellarObjects[0], starSystem, nbRadius);

engine.getStarSystemView().bodyEditor.setVisibility(EditorVisibility.NAVBAR);

engine.toggleStarMap();
