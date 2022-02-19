import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { SolidPlanet } from "./components/planet/solid/planet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";

import sunTexture from "../asset/textures/sun.jpg";

import * as style from "../styles/style.scss";
import { PlayerControler } from "./components/player/playerControler";
import { Keyboard } from "./components/inputs/keyboard";
import { Mouse } from "./components/inputs/mouse";
import { Gamepad } from "./components/inputs/gamepad";
import { CollisionWorker } from "./components/workers/collisionWorker";
import { PlanetManager } from "./components/planet/planetManager";

import { FlatCloudsPostProcess } from "./components/postProcesses/flatCloudsPostProcess";
import { RingsPostProcess } from "./components/postProcesses/RingsPostProcess";
import { centeredRandom, nrand, randInt } from "./components/toolbox/random";
import { StarfieldPostProcess } from "./components/postProcesses/starfieldPostProcess";
style.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

console.log("GPU utilisé : " + engine.getGlInfo().renderer);

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let depthRenderer = new BABYLON.DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

const radius = 1000 * 1e3; // diamètre en m

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let player = new PlayerControler(scene);
player.setSpeed(0.2 * radius);
player.mesh.rotate(player.camera.getDirection(BABYLON.Axis.Y), 0.45, BABYLON.Space.WORLD);

player.camera.maxZ = Math.max(radius * 50, 10000);



let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.4 * radius, scene);
let starMaterial = new BABYLON.ShaderMaterial("starColor", scene, "./shaders/starMaterial",
    {
        attributes: ["position"],
        uniforms: [
            "world", "worldViewProjection", "planetWorldMatrix",
        ]
    }
);
starMaterial.setMatrix("planetWorldMatrix", sun.getWorldMatrix());
sun.material = starMaterial;
sun.position.x = -913038.375;
sun.position.z = -1649636.25;
depthRenderer.getDepthMap().renderList?.push(sun);

let starfield = new StarfieldPostProcess("starfield", player, sun, scene);

let planetManager = new PlanetManager();


let planet = new SolidPlanet("Hécate", radius, new BABYLON.Vector3(0, 0, 4 * radius), 1, scene, {
    minTemperature: randInt(-50, 5),
    maxTemperature: randInt(10, 50),
    pressure: Math.max(nrand(1, 0.5), 0),
    waterAmount: Math.max(nrand(1, 0.6), 0),
}, [
    Math.round(centeredRandom() * 1000000),
    Math.round(centeredRandom() * 1000000),
    Math.round(centeredRandom() * 1000000)
]);
console.log("seed : ", planet._seed.toString());
console.table(planet._physicalProperties);
planet.colorSettings.plainColor = new BABYLON.Vector3(0.22, 0.37, 0.024).add(new BABYLON.Vector3(centeredRandom(), centeredRandom(), centeredRandom()).scale(0.1));
planet.colorSettings.sandSize = 250 + 100 * centeredRandom();
planet.colorSettings.steepSharpness = 1;
planet.terrainSettings.continentsFragmentation = nrand(0.5, 0.2);

let waterElevation = 20e2 * planet._physicalProperties.waterAmount;
planet.colorSettings.waterLevel = waterElevation;

planet.updateColors();
planet.attachNode.position.x = radius * 2;
planet.attachNode.rotate(BABYLON.Axis.X, centeredRandom(), BABYLON.Space.WORLD);

let ocean = new OceanPostProcess("ocean", planet.attachNode, radius + waterElevation, sun, player.camera, scene);

if (planet._physicalProperties.waterAmount > 0 && planet._physicalProperties.pressure > 0) {
    let flatClouds = new FlatCloudsPostProcess("clouds", planet.attachNode, radius, waterElevation, radius + 15e3, sun, player.camera, scene);
    flatClouds.settings.cloudPower = 10 * Math.exp(-planet._physicalProperties.waterAmount * planet._physicalProperties.pressure);
}

if (planet._physicalProperties.pressure > 0) {
    let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, radius, radius + 100e3, sun, player.camera, scene);
    atmosphere.settings.intensity = 15 * planet._physicalProperties.pressure;
    atmosphere.settings.falloffFactor = 24;
    atmosphere.settings.scatteringStrength = 1.0;
}

let rings = new RingsPostProcess("rings", planet.attachNode, radius, waterElevation, sun, player.camera, scene);
rings.settings.ringStart = 1.8 + 0.4 * centeredRandom();
rings.settings.ringEnd = 2.5 + 0.4 * centeredRandom();

planetManager.add(planet);

let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun, 100);

let fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, player.camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
    }
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w" && player.nearestPlanet != null) player.nearestPlanet.surfaceMaterial.wireframe = !player.nearestPlanet.surfaceMaterial.wireframe;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

let collisionWorker = new CollisionWorker(player, planetManager, sun);

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    scene.beforeRender = () => {
        player.nearestPlanet = planetManager.getNearestPlanet();
        // si trop loin on osef
        if (player.nearestPlanet != null && player.nearestPlanet.getAbsolutePosition().length() > player.nearestPlanet._radius * 2) {
            player.nearestPlanet = null;
        }

        planetManager.update(player, sun.position, depthRenderer);

        if (isMouseEnabled) {
            player.listenToMouse(mouse, engine.getDeltaTime() / 1000);
        }

        gamepad.update();

        let deplacement = player.listenToGamepad(gamepad, engine.getDeltaTime() / 1000);

        deplacement.addInPlace(player.listenToKeyboard(keyboard, engine.getDeltaTime() / 1000));

        planetManager.moveEverything(deplacement);
        sun.position.addInPlace(deplacement);

        if (!collisionWorker.isBusy() && player.nearestPlanet != null) {
            collisionWorker.checkCollision(player.nearestPlanet);
        }
    };

    engine.runRenderLoop(() => scene.render());
});

