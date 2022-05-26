import {Axis, Color3, DepthRenderer, Engine, FxaaPostProcess, Scene, Texture, Tools, Vector3} from "@babylonjs/core";

import {SolidPlanet} from "./celestialBodies/planets/solidPlanet";
import {Star} from "./celestialBodies/stars/star";

import {PlayerController} from "./player/playerController";

import {Keyboard} from "./inputs/keyboard";
import {Mouse} from "./inputs/mouse";
import {Gamepad} from "./inputs/gamepad";

import {CollisionWorker} from "./workers/collisionWorker";
import {StarSystemManager} from "./celestialBodies/starSystemManager";

import rockNormalMap from "../asset/textures/rockn.png";

import {StarfieldPostProcess} from "./postProcesses/starfieldPostProcess";

import * as style from "../styles/style.scss";

import {Settings} from "./settings";
import {CelestialBodyType} from "./celestialBodies/interfaces";
import {BodyEditor, EditorVisibility} from "./ui/bodyEditor";

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

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

let player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.PLANET_RADIUS);
player.camera.maxZ = Settings.PLANET_RADIUS * 100000;

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let starSystem = new StarSystemManager(Settings.VERTEX_RESOLUTION);

let starfield = new StarfieldPostProcess("starfield", scene);

let sun = new Star("Weierstrass", 400 * Settings.PLANET_RADIUS, starSystem, scene);
sun.translate(new Vector3(-1, 0, -1).normalizeToNew().scale(Settings.PLANET_RADIUS * 10000));

starfield.setStar(sun);

let planet = new SolidPlanet("Hécate", Settings.PLANET_RADIUS, starSystem, scene);
planet.rotate(Axis.X, 0.2);

planet.physicalProperties.rotationPeriod /= 50

planet.translate(new Vector3(0, 0, 3 * planet.getRadius()));

planet.createOcean(sun, scene);
planet.createClouds(Settings.CLOUD_LAYER_HEIGHT, sun, scene);
planet.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene);
planet.createRings(sun, scene);

let moon = new SolidPlanet("Manaleth", Settings.PLANET_RADIUS / 4, starSystem, scene, {
    mass: 2,
    rotationPeriod: 24 * 60 * 60,
    rotationAxis: Axis.Y,

    minTemperature: -180,
    maxTemperature: 200,
    pressure: 0,
    waterAmount: 0.5
});

moon.orbitalProperties = {
    period: moon.physicalProperties.rotationPeriod,
    apoapsis: 10 * planet.getRadius(),
    periapsis: 7 * planet.getRadius()
}

moon.terrainSettings.continentsFragmentation = 1;
moon.terrainSettings.maxMountainHeight = 5e3;
moon.colorSettings.plainColor = new Color3(0.67, 0.67, 0.67);
moon.colorSettings.desertColor = new Color3(116, 134, 121).scale(1 / 255);
moon.updateMaterial();

moon.surfaceMaterial.setTexture("plainNormalMap", new Texture(rockNormalMap));
moon.surfaceMaterial.setTexture("bottomNormalMap", new Texture(rockNormalMap));

moon.translate(new Vector3(moon.orbitalProperties.periapsis, 0, 0));
moon.translate(planet.getAbsolutePosition());

let Ares = new SolidPlanet("Ares", Settings.PLANET_RADIUS, starSystem, scene, {
    mass: 7,
    rotationPeriod: 24 * 60 * 60 / 100,
    rotationAxis: Axis.Y,

    minTemperature: -80,
    maxTemperature: 20,
    pressure: 0.5,
    waterAmount: 0.3
});
Ares.translate(new Vector3(-1.5, 0, 2).scale(Settings.PLANET_RADIUS * 30));

Ares.terrainSettings.continentsFragmentation = 0.5;
Ares.terrainSettings.continentBaseHeight = 5e3;
Ares.terrainSettings.maxMountainHeight = 20e3;
Ares.terrainSettings.mountainsMinValue = 0.4;

Ares.colorSettings.plainColor = new Color3(0.4, 0.3, 0.3);
Ares.colorSettings.beachColor = new Color3(0.3, 0.15, 0.1);
Ares.colorSettings.bottomColor = new Color3(0.05, 0.1, 0.15);
Ares.updateMaterial();

let aresAtmosphere = Ares.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene); // = new AtmosphericScatteringPostProcess("atmosphere", Ares, radius + 70e3, sun, scene);
aresAtmosphere.settings.redWaveLength = 500;
aresAtmosphere.settings.greenWaveLength = 680;
aresAtmosphere.settings.blueWaveLength = 670;

let fxaa = new FxaaPostProcess("fxaa", 1, player.camera, Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

let collisionWorker = new CollisionWorker(player, starSystem);

// update to current date
starSystem.update(player, sun.getAbsolutePosition(), depthRenderer, Date.now() / 1000);

function updateScene() {
    let deltaTime = engine.getDeltaTime() / 1000;

    player.nearestBody = starSystem.getMostInfluentialBodyAtPoint(player.getAbsolutePosition());
    if (player.nearestBody.getName() != bodyEditor.currentBodyId) bodyEditor.setBody(player.nearestBody, sun, player);

    document.getElementById("planetName")!.innerText = player.isOrbiting() ? player.nearestBody.getName() : "Outer Space";

    if (isMouseEnabled) player.listenToMouse(mouse, deltaTime);

    let deplacement = player.listenToGamepad(gamepad, deltaTime);
    deplacement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));
    starSystem.translateAllCelestialBody(deplacement);

    starSystem.update(player, sun.getAbsolutePosition(), depthRenderer, deltaTime * Settings.TIME_MULTIPLIER);

    if (!collisionWorker.isBusy() && player.isOrbiting()) {
        if (player.nearestBody?.getBodyType() == CelestialBodyType.SOLID) {
            collisionWorker.checkCollision(player.nearestBody as SolidPlanet);
        }
    }
}

document.addEventListener("keydown", e => {
    if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, {precision: 4});
    if (e.key == "u") bodyEditor.setVisibility((bodyEditor.getVisibility() == EditorVisibility.HIDDEN) ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w" && player.isOrbiting()) (<SolidPlanet><unknown>player.nearestBody).surfaceMaterial.wireframe = !(<SolidPlanet><unknown>player.nearestBody).surfaceMaterial.wireframe;
});

function resizeUI() {
    if (bodyEditor.getVisibility() != EditorVisibility.FULL) canvas.width = window.innerWidth;
    else canvas.width = window.innerWidth - 300; // on compte le panneau
    canvas.height = window.innerHeight;
    engine.resize();
}

window.addEventListener("resize", () => resizeUI());

resizeUI();

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});

