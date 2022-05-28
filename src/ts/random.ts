import { Axis, Color3, DepthRenderer, Engine, FxaaPostProcess, Scene, Tools, Vector3 } from "@babylonjs/core";

import { SolidPlanet } from "./celestialBodies/planets/solidPlanet";

import * as style from "../styles/style.scss";
import { PlayerController } from "./player/playerController";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./celestialBodies/starSystemManager";

import { centeredRandom, nrand, randInt } from "./utils/random";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Star } from "./celestialBodies/stars/star";
import { Settings } from "./settings";
import { CelestialBodyType } from "./celestialBodies/interfaces";
import { clamp } from "./utils/math";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor";

style.default;

let bodyEditor = new BodyEditor(EditorVisibility.FULL);

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new Engine(canvas);
engine.loadingScreen.displayLoadingUI();

console.log("GPU utilisé : " + engine.getGlInfo().renderer);

let scene = new Scene(engine);

let depthRenderer = new DepthRenderer(scene);
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.PLANET_RADIUS);

player.camera.maxZ = Settings.PLANET_RADIUS * 5000;

let starfield = new StarfieldPostProcess("starfield", scene);

let starSystemManager = new StarSystemManager(64);

let starRadius = clamp(nrand(0.5, 0.2), 0.2, 1.5) * Settings.PLANET_RADIUS * 100;
let sun = new Star("Weierstrass", starRadius, starSystemManager, scene, {
    mass: 1000,
    rotationPeriod: 60 * 60 * 24,
    rotationAxis: Axis.Y,

    temperature: clamp(nrand(5778, 2000), 0, 10000)
});
console.table(sun.physicalProperties);

sun.translate(new Vector3(-9, 0, -17).scale(100000000));

starfield.setStar(sun);

let planet = new SolidPlanet(
    "Hécate",
    Settings.PLANET_RADIUS,
    starSystemManager,
    scene,
    {
        mass: 10,
        rotationPeriod: (24 * 60 * 60) / 10,
        rotationAxis: Axis.Y,

        minTemperature: randInt(-50, 5),
        maxTemperature: randInt(10, 50),
        pressure: Math.max(nrand(1, 0.5), 0),
        waterAmount: Math.max(nrand(1, 0.6), 0)
    },
    [centeredRandom() * 100000e3, centeredRandom() * 100000e3, centeredRandom() * 100000e3]
);
planet.translate(new Vector3(0, 0, 4 * planet.getRadius()));
console.log("seed : ", planet.getSeed().toString());
console.table(planet.physicalProperties);
planet.material.colorSettings.plainColor = new Color3(0.22, 0.37, 0.024).add(new Color3(centeredRandom(), centeredRandom(), centeredRandom()).scale(0.1));
planet.material.colorSettings.beachSize = 250 + 100 * centeredRandom();
planet.terrainSettings.continentsFragmentation = clamp(nrand(0.5, 0.2), 0, 1);

planet.material.updateManual();

planet.rotate(Axis.X, centeredRandom() / 2);

planet.createOcean(sun, scene);

if (planet.physicalProperties.waterAmount > 0 && planet.physicalProperties.pressure > 0 && Math.random() < 0.8) {
    let flatClouds = planet.createClouds(Settings.CLOUD_LAYER_HEIGHT, sun, scene);
    flatClouds.settings.cloudPower = 10 * Math.exp(-planet.physicalProperties.waterAmount * planet.physicalProperties.pressure);
}

if (planet.physicalProperties.pressure > 0) {
    let atmosphere = planet.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene);
    atmosphere.settings.redWaveLength *= 1 + centeredRandom() / 3;
    atmosphere.settings.greenWaveLength *= 1 + centeredRandom() / 3;
    atmosphere.settings.blueWaveLength *= 1 + centeredRandom() / 3;
}

if (Math.random() < 0.9) {
    let rings = planet.createRings(sun, scene);
    rings.settings.ringStart = 1.8 + 0.4 * centeredRandom();
    rings.settings.ringEnd = 2.5 + 0.4 * centeredRandom();
    rings.settings.ringOpacity = Math.random();
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
            if (player.nearestBody?.getBodyType() == CelestialBodyType.SOLID) {
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
