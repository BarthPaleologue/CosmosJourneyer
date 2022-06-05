import { Axis, FxaaPostProcess, Tools, Vector3 } from "@babylonjs/core";

import { SolidPlanet } from "./celestialBodies/planets/solidPlanet";

import "../styles/style.scss";
import { PlayerController } from "./player/playerController";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./celestialBodies/starSystemManager";

import { centeredRandom, normalRandom, randBool, randRangeInt, unpackSeedToVector3 } from "./utils/random";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Star } from "./celestialBodies/stars/star";
import { Settings } from "./settings";
import { BodyType } from "./celestialBodies/interfaces";
import { clamp } from "./utils/math";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor";
import { initCanvasEngineScene, initDepthRenderer } from "./utils/init";
import { Assets } from "./assets";

import { alea } from "seedrandom";

const bodyEditor = new BodyEditor();
const [canvas, engine, scene] = initCanvasEngineScene("renderer");
const depthRenderer = initDepthRenderer(scene);

Assets.Init(scene);

const keyboard = new Keyboard();
const mouse = new Mouse();
const gamepad = new Gamepad();

const player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.PLANET_RADIUS);

player.camera.maxZ = Settings.PLANET_RADIUS * 100000;

const starfield = new StarfieldPostProcess("starfield", scene);

const starSystemManager = new StarSystemManager(Settings.VERTEX_RESOLUTION);

const starSystemSeed = randRangeInt(0, Number.MAX_SAFE_INTEGER);
const starSystemRand = alea(starSystemSeed.toString());

const starSeed = randRangeInt(0, Number.MAX_SAFE_INTEGER, starSystemRand);
console.log("Star seed : ", starSeed);
const randStar = alea(starSeed.toString());

const starRadius = clamp(normalRandom(0.5, 0.2, randStar), 0.2, 1.5) * Settings.PLANET_RADIUS * 100;
const sun = new Star("Weierstrass", starRadius, starSystemManager, scene, {
    mass: 1000,
    rotationPeriod: 60 * 60 * 24,

    temperature: clamp(normalRandom(5778, 2000, randStar), 4000, 10000)
});
sun.rotate(Axis.Z, centeredRandom(randStar) / 2);
sun.translate(new Vector3(-9, 0, -17).scale(100000000));

if (randBool(0.2, randStar)) {
    let rings = sun.createRings(sun, scene);
    rings.settings.ringStart = normalRandom(3, 1, randStar);
    rings.settings.ringEnd = normalRandom(7, 1, randStar);
    rings.settings.ringOpacity = randStar();
}

starfield.setStar(sun);

const planetSeed = randRangeInt(0, Number.MAX_SAFE_INTEGER, starSystemRand);
console.log("Planet seed : ", planetSeed);
console.log("UNPACKED", unpackSeedToVector3(planetSeed));
const planetRand = alea(planetSeed.toString());

const planet = new SolidPlanet("Hécate", Settings.PLANET_RADIUS, starSystemManager, scene, planetSeed);
planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;
planet.physicalProperties.minTemperature = randRangeInt(-50, 5, planetRand);
planet.physicalProperties.maxTemperature = randRangeInt(10, 50, planetRand);
planet.physicalProperties.pressure = Math.max(normalRandom(1, 0.5, planetRand), 0);
planet.physicalProperties.waterAmount = Math.max(normalRandom(1, 0.3, planetRand), 0);

planet.oceanLevel = Settings.OCEAN_DEPTH * planet.physicalProperties.waterAmount * planet.physicalProperties.pressure;


planet.translate(new Vector3(0, 0, 4 * planet.getRadius()));

planet.material.colorSettings.plainColor.copyFromFloats(0.22 + centeredRandom(planetRand) / 10, 0.37 + centeredRandom(planetRand) / 10, 0.024 + centeredRandom(planetRand) / 10);
planet.material.colorSettings.beachSize = 250 + 100 * centeredRandom(planetRand);
planet.material.updateManual();

planet.terrainSettings.continentsFragmentation = clamp(normalRandom(0.5, 0.2, planetRand), 0, 1);

planet.rotate(Axis.X, centeredRandom(planetRand) / 2);

planet.createOcean(sun, scene);

if (planet.physicalProperties.waterAmount > 0 && planet.physicalProperties.pressure > 0 && randBool(0.8, planetRand)) {
    let flatClouds = planet.createClouds(Settings.CLOUD_LAYER_HEIGHT, sun, scene);
    flatClouds.settings.cloudPower = 10 * Math.exp(-planet.physicalProperties.waterAmount * planet.physicalProperties.pressure);
}

if (planet.physicalProperties.pressure > 0) {
    let atmosphere = planet.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene);
    atmosphere.settings.redWaveLength *= 1 + centeredRandom(planetRand) / 3;
    atmosphere.settings.greenWaveLength *= 1 + centeredRandom(planetRand) / 3;
    atmosphere.settings.blueWaveLength *= 1 + centeredRandom(planetRand) / 3;
}

if (randBool(0.6, planetRand)) {
    let rings = planet.createRings(sun, scene);
    rings.settings.ringStart = 1.8 + 0.4 * centeredRandom(planetRand);
    rings.settings.ringEnd = 2.5 + 0.4 * centeredRandom(planetRand);
    rings.settings.ringOpacity = planetRand();
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

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    scene.registerBeforeRender(() => {
        const deltaTime = engine.getDeltaTime() / 1000;

        player.nearestBody = starSystemManager.getNearestBody();
        if (player.nearestBody.getName() != bodyEditor.currentBodyId) bodyEditor.setBody(player.nearestBody, sun, player);

        starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer, Settings.TIME_MULTIPLIER * deltaTime);

        if (isMouseEnabled) player.listenToMouse(mouse, deltaTime);

        let deplacement = player.listenToGamepad(gamepad, deltaTime);

        deplacement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));

        starSystemManager.translateAllCelestialBody(deplacement);

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
