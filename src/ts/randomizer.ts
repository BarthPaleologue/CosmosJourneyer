import { FxaaPostProcess, Tools } from "@babylonjs/core";

import { SolidPlanet } from "./celestialBodies/planets/solidPlanet";

import "../styles/index.scss";
import { PlayerController } from "./player/playerController";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./celestialBodies/starSystemManager";

import { centeredRand, normalRandom, randRange, randRangeInt, uniformRandBool } from "extended-random";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Star } from "./celestialBodies/stars/star";
import { Settings } from "./settings";
import { BodyType } from "./celestialBodies/interfaces";
import { clamp } from "./utils/math";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor";
import { initCanvasEngineScene } from "./utils/init";
import { Assets } from "./assets";

import { alea } from "seedrandom";
import { getOrbitalPeriod } from "./orbits/kepler";
import { AbstractBody } from "./celestialBodies/abstractBody";
import { GazPlanet } from "./celestialBodies/planets/gazPlanet";

const bodyEditor = new BodyEditor();
const [canvas, engine, scene] = initCanvasEngineScene("renderer");

const player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.PLANET_RADIUS);
player.camera.maxZ = Settings.PLANET_RADIUS * 100000;

Assets.Init(scene);

const keyboard = new Keyboard();
const mouse = new Mouse();
const gamepad = new Gamepad();

const starfield = new StarfieldPostProcess("starfield", scene);

const starSystemManager = new StarSystemManager(scene, Settings.VERTEX_RESOLUTION);

const starSystemSeed = randRangeInt(0, Number.MAX_SAFE_INTEGER);
const starSystemRand = alea(starSystemSeed.toString());

const starSeed = randRange(-10, 10, starSystemRand);
console.log("Star seed : ", starSeed);

// TODO: generate radius inside body constructor
const randStar = alea(starSeed.toString());
const starRadius = clamp(normalRandom(0.5, 0.2, randStar), 0.4, 1.5) * Settings.PLANET_RADIUS * 100;

const sun = new Star("Weierstrass", starRadius, starSystemManager, starSeed, []);

starfield.setStar(sun);

const planetSeed = randRange(-10, 10, starSystemRand);
console.log("Planet seed : ", planetSeed);

let planet: AbstractBody;

if(uniformRandBool(0.5)) planet = new SolidPlanet("Hécate", Settings.PLANET_RADIUS, starSystemManager, planetSeed, [sun]);
else planet = new GazPlanet("Andromaque", Settings.PLANET_RADIUS, starSystemManager, planetSeed, [sun]);

console.table(planet.orbitalProperties);

planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;

if(planet.getBodyType() == BodyType.SOLID) {
    const solidPlanet = planet as SolidPlanet;

    //TODO: use formula
    solidPlanet.physicalProperties.minTemperature = randRangeInt(-50, 5, planet.rng);
    solidPlanet.physicalProperties.maxTemperature = randRangeInt(10, 50, planet.rng);

    solidPlanet.material.colorSettings.plainColor.copyFromFloats(0.22 + centeredRand(planet.rng) / 10, 0.37 + centeredRand(planet.rng) / 10, 0.024 + centeredRand(planet.rng) / 10);
    solidPlanet.material.colorSettings.beachSize = 250 + 100 * centeredRand(planet.rng);
    solidPlanet.material.updateManual();
}


for(let i = 0; i < randRangeInt(0, 4, planet.rng); i++) {
    const satelliteSeed = planet.rng();
    const randSatellite = alea(satelliteSeed.toString());
    const satelliteRadius = (planet.getRadius() / 5) * clamp(normalRandom(1, 0.1, randSatellite), 0.5, 1.5);
    const ratio = satelliteRadius / Settings.PLANET_RADIUS;
    const satellite = new SolidPlanet(`${planet.getName()}Sattelite${i}`, satelliteRadius, starSystemManager, satelliteSeed, [planet]);
    console.log(satellite.depth)
    const periapsis = 5 * planet.getRadius() + i * clamp(normalRandom(1, 0.1, randSatellite), 0.9, 1.0) * planet.getRadius() * 2;
    const apoapsis = periapsis * clamp(normalRandom(1, 0.05, randSatellite), 1, 1.5);
    satellite.physicalProperties.mass = 1;
    satellite.orbitalProperties = {
        periapsis: periapsis,
        apoapsis: apoapsis,
        period: getOrbitalPeriod(periapsis, apoapsis, satellite.parentBodies),
        orientationQuaternion: satellite.getRotationQuaternion()
    }
    satellite.terrainSettings.maxMountainHeight *= ratio;
    satellite.terrainSettings.mountainsFrequency *= ratio;
}

let fxaa = new FxaaPostProcess("fxaa", 1, player.camera);

let isMouseEnabled = false;

document.addEventListener("keydown", (e) => {
    if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
    if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w" && player.nearestBody != null)
        (<SolidPlanet>(<unknown>player.nearestBody)).material.wireframe = !(<SolidPlanet>(<unknown>player.nearestBody)).material.wireframe;
});

let collisionWorker = new CollisionWorker(player, starSystemManager);


starSystemManager.update(player, sun.getAbsolutePosition(), 0);
starSystemManager.update(player, sun.getAbsolutePosition(), Date.now());
starSystemManager.update(player, sun.getAbsolutePosition(), 0);
starSystemManager.update(player, sun.getAbsolutePosition(), 0);
starSystemManager.update(player, sun.getAbsolutePosition(), 0);

player.positionNearBody(planet);

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    scene.registerBeforeRender(() => {
        const deltaTime = engine.getDeltaTime() / 1000;

        player.nearestBody = starSystemManager.getNearestBody();
        if (player.nearestBody.getName() != bodyEditor.currentBodyId) bodyEditor.setBody(player.nearestBody, sun, player);

        starSystemManager.update(player, sun.getAbsolutePosition(), Settings.TIME_MULTIPLIER * deltaTime);

        if (isMouseEnabled) player.listenToMouse(mouse, deltaTime);

        let deplacement = player.listenToGamepad(gamepad, deltaTime);

        deplacement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));

        starSystemManager.translateAllBodies(deplacement);

        if (!collisionWorker.isBusy() && player.isOrbiting()) {
            if (player.nearestBody?.getBodyType() == BodyType.SOLID) {
                collisionWorker.checkCollision(player.nearestBody as SolidPlanet);
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
