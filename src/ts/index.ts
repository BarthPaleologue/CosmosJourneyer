import {
    Axis,
    DepthRenderer,
    Engine,
    FxaaPostProcess,
    Scene,
    Texture,
    Tools,
    Vector3,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";

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

style.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new Engine(canvas, true);
engine.loadingScreen.displayLoadingUI();

console.log("GPU utilisé : " + engine.getGlInfo().renderer);

let scene = new Scene(engine);

let depthRenderer = new DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.PLANET_RADIUS);
player.rotate(player.getUpwardDirection(), 0.8);

player.camera.maxZ = Math.max(Settings.PLANET_RADIUS * 100, 10000);

let starSystem = new StarSystemManager(Settings.VERTEX_RESOLUTION);

let sun = new Star("Weierstrass", 0.4 * Settings.PLANET_RADIUS, starSystem, scene);
sun.translate(new Vector3(-910000, 0, -1700000));

depthRenderer.setMaterialForRendering(sun.mesh);

let starfield = new StarfieldPostProcess("starfield", sun, scene);

let planet = new SolidPlanet("Hécate", Settings.PLANET_RADIUS, starSystem, scene);
planet.physicalProperties.rotationPeriod = 24 * 60 * 60 / 100;

planet.rotate(Axis.X, 0.2);

const ocean = planet.createOcean(sun, scene);
const flatClouds = planet.createClouds(Settings.CLOUD_LAYER_HEIGHT, sun, scene);
const atmosphere = planet.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene);
planet.createRings(sun, scene);

planet.translate(new Vector3(Settings.PLANET_RADIUS * 5, 0, 4 * Settings.PLANET_RADIUS))

let moon = new SolidPlanet("Manaleth", Settings.PLANET_RADIUS / 4, starSystem, scene, {
    rotationPeriod: 28 * 24 * 60 * 60,
    rotationAxis: Axis.Y,

    minTemperature: -180,
    maxTemperature: 200,
    pressure: 0,
    waterAmount: 0.5
});
moon.terrainSettings.continentsFragmentation = 1;
moon.terrainSettings.maxMountainHeight = 5e3;
moon.colorSettings.plainColor = new Vector3(0.5, 0.5, 0.5);
moon.colorSettings.desertColor = new Vector3(0.4, 0.4, 0.4);
moon.colorSettings.steepColor = new Vector3(0.1, 0.1, 0.1);
moon.updateColors();

moon.surfaceMaterial.setTexture("plainNormalMap", new Texture(rockNormalMap, scene));
moon.surfaceMaterial.setTexture("bottomNormalMap", new Texture(rockNormalMap, scene));
moon.surfaceMaterial.setTexture("sandNormalMap", new Texture(rockNormalMap, scene));

moon.translate(new Vector3(Math.cos(2.5), 0, Math.sin(2.5)).scale(3 * planet.getRadius()));
moon.translate(planet.attachNode.getAbsolutePosition());

let Ares = new SolidPlanet("Ares", Settings.PLANET_RADIUS, starSystem, scene, {
    rotationPeriod: 24 * 60 * 60 / 100,
    rotationAxis: Axis.Y,

    minTemperature: -80,
    maxTemperature: 20,
    pressure: 0.5,
    waterAmount: 0.3
});
Ares.translate(new Vector3(-1, 0, 1).scale(Settings.PLANET_RADIUS * 4));

Ares.terrainSettings.continentsFragmentation = 0.5;
Ares.terrainSettings.continentBaseHeight = 5e3;
Ares.terrainSettings.maxMountainHeight = 20e3;
Ares.terrainSettings.mountainsMinValue = 0.4;

Ares.colorSettings.plainColor = new Vector3(0.4, 0.3, 0.3);
Ares.colorSettings.beachColor = new Vector3(0.3, 0.15, 0.1);
Ares.colorSettings.bottomColor = new Vector3(0.05, 0.1, 0.15);
Ares.updateColors();

let aresAtmosphere = Ares.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene); // = new AtmosphericScatteringPostProcess("atmosphere", Ares, radius + 70e3, sun, scene);
aresAtmosphere.settings.redWaveLength = 500;
aresAtmosphere.settings.greenWaveLength = 680;
aresAtmosphere.settings.blueWaveLength = 670;


// TODO: mettre le VLS dans Star => par extension créer un système de gestion des post process généralisé
let vls = new VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun.mesh, 100);
vls.exposure = 1.0;
vls.decay = 0.95;

let fxaa = new FxaaPostProcess("fxaa", 1, player.camera, Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

let collisionWorker = new CollisionWorker(player, starSystem);

// update to current date
starSystem.update(player, sun.getAbsolutePosition(), depthRenderer, Date.now() / 1000);

function updateScene() {

    let deltaTime = engine.getDeltaTime() / 1000;

    player.nearestBody = starSystem.getNearestBody();

    document.getElementById("planetName")!.innerText = player.isOrbiting() ? player.nearestBody!.getName() : "Outer Space";

    starSystem.update(player, sun.getAbsolutePosition(), depthRenderer, deltaTime * Settings.TIME_MULTIPLIER);

    if (isMouseEnabled) player.listenToMouse(mouse, deltaTime);

    gamepad.update();

    let deplacement = player.listenToGamepad(gamepad, deltaTime);
    deplacement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));
    starSystem.translateAllCelestialBody(deplacement);

    if (!collisionWorker.isBusy() && player.isOrbiting()) {
        if (player.nearestBody?.getBodyType() == CelestialBodyType.SOLID) {
            collisionWorker.checkCollision(player.nearestBody as SolidPlanet);
        }
    }
}

document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, {precision: 4});
    }
    if (e.key == "u") atmosphere.settings.intensity = (atmosphere.settings.intensity == 0) ? 15 : 0;
    if (e.key == "o") ocean.settings.oceanRadius = (ocean.settings.oceanRadius == 0) ? planet.getRadius() : 0;
    if (e.key == "y") flatClouds.settings.cloudLayerRadius = (flatClouds.settings.cloudLayerRadius == 0) ? planet.getRadius() + Settings.CLOUD_LAYER_HEIGHT : 0;
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w" && player.isOrbiting()) (<SolidPlanet><unknown>player.nearestBody).surfaceMaterial.wireframe = !(<SolidPlanet><unknown>player.nearestBody).surfaceMaterial.wireframe;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.beforeRender = updateScene;
    engine.runRenderLoop(() => scene.render());
});

