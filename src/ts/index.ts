import {
    Engine,
    Scene,
    DepthRenderer,
    Axis,
    Vector3,
    Texture,
    Tools,
    FxaaPostProcess,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";

import {SolidPlanet} from "./celestialBodies/planets/solid/solidPlanet";
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
player.rotate(player.getUpwardDirection(), 0.8);

player.camera.maxZ = Math.max(radius * 100, 10000);

let starSystem = new StarSystemManager(64);

let sun = new Star("Weierstrass", 0.4 * radius, starSystem, scene);
sun.translate(new Vector3(-910000, 0, -1700000));

depthRenderer.setMaterialForRendering(sun.mesh);

let starfield = new StarfieldPostProcess("starfield", sun, scene);

let planet = new SolidPlanet("Hécate", radius, starSystem, scene);
planet.physicalProperties.rotationPeriod = 24 * 60 * 60 / 100;

planet.rotate(Axis.X, 0.2);

const ocean = planet.createOcean(sun, scene);
const flatClouds = planet.createClouds(sun, scene);
const atmosphere = planet.createAtmosphere(sun, scene);
planet.createRings(sun, scene);

planet.translate(new Vector3(radius * 5, 0, 4 * radius))

let moon = new SolidPlanet("Manaleth", radius / 4, starSystem, scene, {
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

moon.translate(new Vector3(Math.cos(2.5), 0, Math.sin(2.5)).scale(3 * radius));
moon.translate(planet.attachNode.getAbsolutePosition());

let Ares = new SolidPlanet("Ares", radius, starSystem, scene, {
    rotationPeriod: 24 * 60 * 60,
    rotationAxis: Axis.Y,

    minTemperature: -80,
    maxTemperature: 20,
    pressure: 0.5,
    waterAmount: 0.3
});
Ares.translate(new Vector3(0, 0, 4 * radius));

Ares.terrainSettings.continentsFragmentation = 0.7;
Ares.terrainSettings.continentBaseHeight = 4e3;
Ares.terrainSettings.maxMountainHeight = 15e3;
Ares.terrainSettings.mountainsMinValue = 0.7;

Ares.colorSettings.beachColor = Ares.colorSettings.plainColor;
Ares.updateColors();

Ares.translate(new Vector3(-radius * 4, 0, 0));

let aresAtmosphere = Ares.createAtmosphere(sun, scene); // = new AtmosphericScatteringPostProcess("atmosphere", Ares, radius + 70e3, sun, scene);
aresAtmosphere.settings.greenWaveLength = 680;


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

    starSystem.update(player, sun.getAbsolutePosition(), depthRenderer, timeMultiplicator * deltaTime);

    if (isMouseEnabled) player.listenToMouse(mouse, deltaTime);

    gamepad.update();

    let deplacement = player.listenToGamepad(gamepad, deltaTime);
    deplacement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));
    starSystem.translateAllCelestialBody(deplacement);

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
    if (e.key == "u") atmosphere.settings.intensity = (atmosphere.settings.intensity == 0) ? 15 : 0;
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

