import { Color3, FxaaPostProcess, LensFlare, LensFlareSystem, Quaternion, Texture, Tools, Vector3 } from "@babylonjs/core";

import { SolidPlanet } from "./celestialBodies/planets/solidPlanet";
import { Star } from "./celestialBodies/stars/star";

import { PlayerController } from "./player/playerController";

import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";

import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./celestialBodies/starSystemManager";

import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";

import lensFlare from "../asset/lensflare.png";

import "../styles/index.scss";

import { Settings } from "./settings";
import { BodyType } from "./celestialBodies/interfaces";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor";
import { initCanvasEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { GazPlanet } from "./celestialBodies/planets/gazPlanet";

const bodyEditor = new BodyEditor();
const [canvas, engine, scene] = initCanvasEngineScene("renderer");

const player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.PLANET_RADIUS);
player.camera.maxZ = Settings.PLANET_RADIUS * 100000;

Assets.Init(scene);

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let starSystem = new StarSystemManager(scene, Settings.VERTEX_RESOLUTION);

let starfield = new StarfieldPostProcess("starfield", scene);

let sun = new Star("Weierstrass", Settings.PLANET_RADIUS, starSystem, scene, 788, []);
sun.orbitalProperties.period = 60 * 60 * 24;
starfield.setStar(sun);

/*const lensFlareSystem = new LensFlareSystem("lensFlareSystem", sun.transform, scene);
const flare00 = new LensFlare(
    1.5, // size
    0, // position
    new Color3(1, 1, 1), // color
    lensFlare, // texture
    lensFlareSystem // lens flare system
);*/

let planet = new SolidPlanet("Hécate", Settings.PLANET_RADIUS, starSystem, scene, 1e6, [sun]);

planet.physicalProperties.rotationPeriod /= 50;

planet.orbitalProperties = {
    period: 60 * 60 * 24 * 365.25,
    apoapsis: 40 * planet.getRadius(),
    periapsis: 35 * planet.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};
starSystem.update(player, sun.getAbsolutePosition(), 0);

planet.createOcean(sun, scene);
planet.createClouds(Settings.CLOUD_LAYER_HEIGHT, sun, scene);
planet.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene);
planet.createRings(sun, scene);

let moon = new SolidPlanet("Manaleth", Settings.PLANET_RADIUS / 4, starSystem, scene, 437,[planet]);
moon.postProcesses.clouds?.dispose();
moon.physicalProperties.mass = 2;
moon.physicalProperties.rotationPeriod = 7 * 60 * 60;
moon.physicalProperties.minTemperature = -180;
moon.physicalProperties.maxTemperature = 200;
moon.physicalProperties.pressure = 0;
moon.physicalProperties.waterAmount = 0.5;

moon.orbitalProperties = {
    period: moon.physicalProperties.rotationPeriod,
    apoapsis: 6 * planet.getRadius(),
    periapsis: 5 * planet.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};

moon.terrainSettings.continentsFragmentation = 1;
moon.terrainSettings.maxMountainHeight = 5e3;
moon.material.colorSettings.plainColor.copyFromFloats(0.67, 0.67, 0.67);
moon.material.colorSettings.desertColor.copyFrom(new Color3(116, 134, 121).scale(1 / 255));

moon.material.setTexture("plainNormalMap", Assets.DirtNormalMap!);
moon.material.setTexture("bottomNormalMap", Assets.DirtNormalMap!);
moon.material.updateManual();

let ares = new SolidPlanet("Ares", Settings.PLANET_RADIUS, starSystem, scene, 432, [sun]);
ares.postProcesses.clouds?.dispose();
ares.physicalProperties.mass = 7;
ares.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
ares.physicalProperties.minTemperature = -80;
ares.physicalProperties.maxTemperature = 20;
ares.physicalProperties.pressure = 0.5;
ares.physicalProperties.waterAmount = 0.3;

ares.orbitalProperties = {
    period: 60 * 60 * 24 * 430,
    periapsis: 50 * ares.getRadius(),
    apoapsis: 51 * ares.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};

ares.terrainSettings.continentsFragmentation = 0.5;
ares.terrainSettings.continentBaseHeight = 5e3;
ares.terrainSettings.maxMountainHeight = 20e3;
ares.terrainSettings.mountainsMinValue = 0.4;

ares.material.colorSettings.plainColor.copyFromFloats(0.4, 0.3, 0.3);
ares.material.colorSettings.beachColor.copyFromFloats(0.3, 0.15, 0.1);
ares.material.colorSettings.bottomColor.copyFromFloats(0.05, 0.1, 0.15);

ares.oceanLevel = Settings.OCEAN_DEPTH * ares.physicalProperties.waterAmount * ares.physicalProperties.pressure;

ares.material.updateManual();

let aresAtmosphere = ares.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene);
aresAtmosphere.settings.redWaveLength = 500;
aresAtmosphere.settings.greenWaveLength = 680;
aresAtmosphere.settings.blueWaveLength = 670;

const andromaque = new GazPlanet("Andromaque", Settings.PLANET_RADIUS, starSystem, scene, 25, [sun]);
andromaque.orbitalProperties = {
    period: 60 * 60 * 24 * 431 * 10,
    periapsis: 70 * ares.getRadius(),
    apoapsis: 71 * ares.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};

const fxaa = new FxaaPostProcess("fxaa", 1, player.camera, Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

let collisionWorker = new CollisionWorker(player, starSystem);

// update to current date
starSystem.update(player, sun.getAbsolutePosition(), Date.now() / 1000);

player.positionNearBody(planet);

function updateScene() {
    const deltaTime = engine.getDeltaTime() / 1000;

    player.nearestBody = starSystem.getMostInfluentialBodyAtPoint(player.getAbsolutePosition());
    if (player.nearestBody.getName() != bodyEditor.currentBodyId) bodyEditor.setBody(player.nearestBody, sun, player);

    document.getElementById("planetName")!.innerText = player.isOrbiting() ? player.nearestBody.getName() : "Outer Space";

    if (isMouseEnabled) player.listenToMouse(mouse, deltaTime);

    let playerMovement = player.listenToGamepad(gamepad, deltaTime);
    playerMovement.addInPlace(player.listenToKeyboard(keyboard, deltaTime));
    starSystem.translateAllBodies(playerMovement);

    starSystem.update(player, sun.getAbsolutePosition(), deltaTime * Settings.TIME_MULTIPLIER);

    if (!collisionWorker.isBusy() && player.isOrbiting()) {
        if (player.nearestBody?.getBodyType() == BodyType.SOLID) {
            collisionWorker.checkCollision(player.nearestBody as SolidPlanet);
        }
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
    if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w" && player.isOrbiting()) (<SolidPlanet>(<unknown>player.nearestBody)).material.wireframe = !(<SolidPlanet>(<unknown>player.nearestBody)).material.wireframe;
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
