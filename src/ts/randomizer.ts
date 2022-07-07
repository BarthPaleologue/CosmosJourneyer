import { Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";

import "../styles/index.scss";
import { PlayerController } from "./player/playerController";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./bodies/starSystemManager";

import { centeredRand, normalRandom, randRange, randRangeInt, uniformRandBool } from "extended-random";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Star } from "./bodies/stars/star";
import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { clamp } from "./utils/math";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor";
import { initCanvasEngineScene } from "./utils/init";
import { Assets } from "./assets";

import { alea } from "seedrandom";
import { getOrbitalPeriod } from "./orbits/kepler";
import { AbstractBody } from "./bodies/abstractBody";
import { GazPlanet } from "./bodies/planets/gazPlanet";
import { computeMeanTemperature } from "./utils/temperatureComputation";

const bodyEditor = new BodyEditor();
const [canvas, engine, scene] = initCanvasEngineScene("renderer");

const player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.EARTH_RADIUS);
player.camera.maxZ = Settings.EARTH_RADIUS * 100000;

Assets.Init(scene);

const keyboard = new Keyboard();
const mouse = new Mouse();
const gamepad = new Gamepad();

const starSystemManager = new StarSystemManager(scene, Settings.VERTEX_RESOLUTION);

const starfield = new StarfieldPostProcess("starfield", starSystemManager);

const starSystemSeed = randRangeInt(0, Number.MAX_SAFE_INTEGER);
const starSystemRand = alea(starSystemSeed.toString());

const starSeed = randRange(-10, 10, starSystemRand);
console.log("Star seed : ", starSeed);

const sun = new Star("Weierstrass", starSystemManager, starSeed, []);

starfield.setStar(sun);

const planetSeed = randRange(-10, 10, starSystemRand);
console.log("Planet seed : ", planetSeed);

let planet: AbstractBody;

if (uniformRandBool(0.5)) planet = new TelluricPlanet("Hécate", starSystemManager, planetSeed, [sun]);
else planet = new GazPlanet("Andromaque", starSystemManager, planetSeed, [sun]);

console.table(planet.orbitalProperties);

planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;

if (planet.bodyType == BodyType.TELLURIC) {
    const telluricPlanet = planet as TelluricPlanet;

    //TODO: use formula
    telluricPlanet.physicalProperties.minTemperature = randRangeInt(-50, 5, planet.rng);
    telluricPlanet.physicalProperties.maxTemperature = randRangeInt(10, 50, planet.rng);

    telluricPlanet.material.colorSettings.plainColor.copyFromFloats(
        0.22 + centeredRand(planet.rng) / 10,
        0.37 + centeredRand(planet.rng) / 10,
        0.024 + centeredRand(planet.rng) / 10
    );
    telluricPlanet.material.colorSettings.beachSize = 250 + 100 * centeredRand(planet.rng);
    telluricPlanet.material.updateManual();
}

for (let i = 0; i < randRangeInt(0, 4, planet.rng); i++) {
    const satelliteSeed = planet.rng();
    const randSatellite = alea(satelliteSeed.toString());
    const satelliteRadius = (planet.getRadius() / 5) * clamp(normalRandom(1, 0.1, randSatellite), 0.5, 1.5);
    const ratio = satelliteRadius / Settings.EARTH_RADIUS;
    const satellite = new TelluricPlanet(`${planet.name}Sattelite${i}`, starSystemManager, satelliteSeed, [planet]);
    console.log(satellite.depth);
    const periapsis = 5 * planet.getRadius() + i * clamp(normalRandom(1, 0.1, randSatellite), 0.9, 1.0) * planet.getRadius() * 2;
    const apoapsis = periapsis * clamp(normalRandom(1, 0.05, randSatellite), 1, 1.5);
    satellite.physicalProperties.mass = 1;
    satellite.orbitalProperties = {
        periapsis: periapsis,
        apoapsis: apoapsis,
        period: getOrbitalPeriod(periapsis, apoapsis, satellite.parentBodies),
        orientationQuaternion: satellite.getRotationQuaternion()
    };
    satellite.terrainSettings.maxMountainHeight *= ratio;
    satellite.terrainSettings.mountainsFrequency *= ratio;
}

starSystemManager.init();

let isMouseEnabled = false;

document.addEventListener("keydown", (e) => {
    if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
    if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w" && player.nearestBody != null)
        (<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe = !(<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe;
});

const collisionWorker = new CollisionWorker(player, starSystemManager);

starSystemManager.update(player, sun.getAbsolutePosition(), 0);
starSystemManager.update(player, sun.getAbsolutePosition(), Date.now());
starSystemManager.update(player, sun.getAbsolutePosition(), 0);
starSystemManager.update(player, sun.getAbsolutePosition(), 0);
starSystemManager.update(player, sun.getAbsolutePosition(), 0);

player.positionNearBody(planet);

console.log(
    "Average Temperature : ",
    computeMeanTemperature(sun.physicalProperties.temperature, sun.getApparentRadius(), planet.getAbsolutePosition().subtract(sun.getAbsolutePosition()).length(), 0.3, 0.3) - 273,
    "°C"
);

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    scene.registerBeforeRender(() => {
        const deltaTime = engine.getDeltaTime() / 1000;

        player.nearestBody = starSystemManager.getNearestBody();
        if (player.nearestBody.name != bodyEditor.currentBodyId) bodyEditor.setBody(player.nearestBody, sun, player);

        starSystemManager.update(player, sun.getAbsolutePosition(), Settings.TIME_MULTIPLIER * deltaTime);

        if (isMouseEnabled) player.listenToMouse(mouse, deltaTime);

        const deplacement = player.listenToGamepad(gamepad, deltaTime);

        deplacement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));

        starSystemManager.translateAllBodies(deplacement);

        if (!collisionWorker.isBusy() && player.isOrbiting()) {
            if (player.nearestBody?.bodyType == BodyType.TELLURIC) {
                collisionWorker.checkCollision(player.nearestBody as TelluricPlanet);
            }
        }
    });

    engine.runRenderLoop(() => scene.render());
});

function resizeUI() {
    if (bodyEditor.getVisibility() != EditorVisibility.FULL) canvas.width = window.innerWidth;
    else canvas.width = window.innerWidth - 300; // on compte le panneau
    canvas.height = window.innerHeight;
    engine.resize();
}

window.addEventListener("resize", () => resizeUI());

resizeUI();
