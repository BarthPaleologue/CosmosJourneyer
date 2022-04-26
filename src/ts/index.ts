import {
    Engine,
    Scene,
    Color4,
    DepthRenderer,
    Axis,
    Space,
    Vector3,
    Texture,
    Tools,
    FxaaPostProcess,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";

import {SolidPlanet} from "./components/celestialBodies/planets/solid/solidPlanet";
import {Star} from "./components/celestialBodies/stars/star";

import {PlayerController} from "./components/player/playerController";

import {Keyboard} from "./components/inputs/keyboard";
import {Mouse} from "./components/inputs/mouse";
import {Gamepad} from "./components/inputs/gamepad";

import {CollisionWorker} from "./components/workers/collisionWorker";
import {StarSystemManager} from "./components/celestialBodies/starSystemManager";

import rockNormalMap from "../asset/textures/rockn.png";

import {FlatCloudsPostProcess} from "./components/postProcesses/planetPostProcesses/flatCloudsPostProcess";
import {RingsPostProcess} from "./components/postProcesses/planetPostProcesses/ringsPostProcess";
import {VolumetricCloudsPostProcess} from "./components/postProcesses/planetPostProcesses/volumetricCloudsPostProcess";
import {StarfieldPostProcess} from "./components/postProcesses/starfieldPostProcess";
import {OceanPostProcess} from "./components/postProcesses/planetPostProcesses/oceanPostProcess";
import {
    AtmosphericScatteringPostProcess
} from "./components/postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";


import * as style from "../styles/style.scss";

style.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new Engine(canvas);
engine.loadingScreen.displayLoadingUI();

console.log("GPU utilisé : " + engine.getGlInfo().renderer);

let scene = new Scene(engine);

let depthRenderer = new DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

const timeMultiplicator = 1;
console.log(`Time is going ${timeMultiplicator} time${timeMultiplicator > 1 ? "s" : ""} faster than in reality`);

const radius = 1000 * 1e3; // diamètre en m

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let player = new PlayerController(scene);
player.setSpeed(0.2 * radius);
player.mesh.rotate(player.camera.getDirection(Axis.Y), 0.8, Space.WORLD);

player.camera.maxZ = Math.max(radius * 100, 10000);

let starSystemManager = new StarSystemManager(64);

let sun = new Star("Weierstrass", 0.4 * radius, new Vector3(-910000, 0, -1700000), scene);
starSystemManager.addStar(sun);

depthRenderer.getDepthMap().renderList?.push(sun.mesh);

let starfield = new StarfieldPostProcess("starfield", sun, scene);

let planet = new SolidPlanet("Hécate", radius, new Vector3(radius * 5, 0, 4 * radius), 1, scene);
planet.physicalProperties.rotationPeriod = 24 * 60 * 60 / 100;

planet.colorSettings.plainColor = new Vector3(0.1, 0.4, 0).scale(0.7).add(new Vector3(0.5, 0.3, 0.08).scale(0.3));
planet.colorSettings.beachSize = 300;
planet.updateColors();

planet.rotate(Axis.X, 0.2);

let ocean = new OceanPostProcess("ocean", planet, sun, scene);

let flatClouds = new FlatCloudsPostProcess("clouds", planet, radius + 15e3, sun, scene);
//let volClouds = new VolumetricCloudsPostProcess("clouds", planet, radius + waterElevation + 100e3, sun, player.camera, scene);

let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, radius + 100e3, sun, scene);

let rings = new RingsPostProcess("rings", planet, sun, scene);

starSystemManager.addSolidPlanet(planet);

let moon = new SolidPlanet("Manaleth", radius / 4, new Vector3(Math.cos(2.5), 0, Math.sin(2.5)).scale(3 * radius), 1, scene, {
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
moon.colorSettings.desertColor = moon.colorSettings.plainColor.scale(0.5);
moon.colorSettings.steepColor = new Vector3(0.1, 0.1, 0.1);
moon.updateColors();

moon.surfaceMaterial.setTexture("plainNormalMap", new Texture(rockNormalMap, scene));
moon.surfaceMaterial.setTexture("bottomNormalMap", new Texture(rockNormalMap, scene));
moon.surfaceMaterial.setTexture("sandNormalMap", new Texture(rockNormalMap, scene));

moon.translate(planet.attachNode.getAbsolutePosition());

starSystemManager.addSolidPlanet(moon);

let Ares = new SolidPlanet("Ares", radius, new Vector3(0, 0, 4 * radius), 1, scene, {
    rotationPeriod: 24 * 60 * 60,
    rotationAxis: Axis.Y,

    minTemperature: -80,
    maxTemperature: 20,
    pressure: 0.5,
    waterAmount: 0.3
});

Ares.terrainSettings.continentsFragmentation = 0.7;
Ares.terrainSettings.continentBaseHeight = 4e3;
Ares.terrainSettings.maxMountainHeight = 15e3;
Ares.terrainSettings.mountainsMinValue = 0.7;

Ares.colorSettings.beachColor = Ares.colorSettings.plainColor;
Ares.updateColors();

Ares.translate(new Vector3(-radius * 4, 0, 0));

let atmosphere2 = new AtmosphericScatteringPostProcess("atmosphere", Ares, radius + 70e3, sun, scene);
atmosphere2.settings.intensity = 15 * Ares.physicalProperties.pressure;
atmosphere2.settings.greenWaveLength = 680;

starSystemManager.addSolidPlanet(Ares);

// TODO: mettre le VLS dans Star => par extension créer un système de gestion des post process généralisé
let vls = new VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun.mesh, 100);
vls.exposure = 1.0;
vls.decay = 0.95;

let fxaa = new FxaaPostProcess("fxaa", 1, player.camera, Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

let collisionWorker = new CollisionWorker(player, starSystemManager);

// update to current date
starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer, Date.now() / 1000);

function updateScene() {

    let deltaTime = engine.getDeltaTime() / 1000;

    player.nearestBody = starSystemManager.getNearestBody();

    document.getElementById("planetName")!.innerText = player.isOrbiting() ? player.nearestBody!.getName() : "Outer Space";

    starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer, timeMultiplicator * deltaTime);

    // TODO: make post process manager
    ocean.update(timeMultiplicator * deltaTime);
    flatClouds.update(timeMultiplicator * deltaTime);

    if (isMouseEnabled) {
        player.listenToMouse(mouse, deltaTime);
    }

    gamepad.update();

    let deplacement = player.listenToGamepad(gamepad, deltaTime);
    deplacement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));
    starSystemManager.translateAllCelestialBody(deplacement);

    if (!collisionWorker.isBusy() && player.isOrbiting()) {
        if (player.nearestBody instanceof SolidPlanet) {
            //FIXME: se passer de instanceof
            collisionWorker.checkCollision(player.nearestBody);
        }
    }
}

document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, {precision: 4});
    }
    //if (e.key == "u") atmosphere.settings.intensity = (atmosphere.settings.intensity == 0) ? 15 : 0;
    if (e.key == "o") ocean.settings.oceanRadius = (ocean.settings.oceanRadius == 0) ? planet.getRadius() : 0;
    if (e.key == "y") flatClouds.settings.cloudLayerRadius = (flatClouds.settings.cloudLayerRadius == 0) ? radius + 15e3 : 0;
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

