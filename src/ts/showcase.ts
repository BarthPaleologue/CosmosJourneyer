import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { Planet } from "./components/planet/planet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";
import { VolumetricCloudsPostProcess } from "./components/postProcesses/volumetricCloudsPostProcess";
import { ChunkForge } from "./components/forge/chunkForge";

import sunTexture from "../asset/textures/sun.jpg";

import * as style from "../styles/style.scss";
import { PlayerControler } from "./components/player/playerControler";
import { Keyboard } from "./components/inputs/keyboard";
import { Mouse } from "./components/inputs/mouse";
import { Gamepad } from "./components/inputs/gamepad";
import { CollisionData } from "./components/forge/CollisionData";
import { CollisionWorker } from "./components/workers/collisionWorker";

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

const radius = 300 * 1e3; // diamètre en m

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let player = new PlayerControler(scene);
player.setSpeed(0.2 * radius);
player.mesh.rotate(player.camera.getDirection(BABYLON.Axis.Y), 0.6, BABYLON.Space.WORLD);

player.camera.maxZ = Math.max(radius * 50, 10000);
scene.activeCamera = player.camera;


let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.4 * radius, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture(sunTexture, scene);
sun.material = mat;
sun.position.x = -913038.375;
sun.position.z = -1649636.25;
depthRenderer.getDepthMap().renderList?.push(sun);

let forge = new ChunkForge(64);

let planets: Planet[] = [];

let planet = new Planet("Hécate", radius, new BABYLON.Vector3(0, 0, 4 * radius), 1, forge, scene);
planet.terrainSettings.maxBumpHeight = 1e2;
planet.colorSettings.plainColor = new BABYLON.Vector3(0.1, 0.4, 0);
planet.colorSettings.sandSize = 300;
planet.colorSettings.steepSharpness = 10;
planet.colorSettings.waterLevel = 10e2;

planet.updateColors();
planet.attachNode.position.x = radius * 5;
planets.push(planet);

let moon = new Planet("Manaleth", radius / 4, new BABYLON.Vector3(Math.cos(2.5), 0, Math.sin(2.5)).scale(3 * radius), 1, forge, scene);
moon.terrainSettings.continentsFragmentation = 0;
moon.terrainSettings.maxMountainHeight = 15e3;
moon.terrainSettings.maxBumpHeight = 1e2;
moon.colorSettings.plainColor = new BABYLON.Vector3(0.5, 0.5, 0.5);
moon.colorSettings.sandColor = planet.colorSettings.steepColor;
moon.colorSettings.steepColor = new BABYLON.Vector3(0.1, 0.1, 0.1);
moon.colorSettings.snowLatitudePersistence = 2;
moon.colorSettings.snowElevation01 = 0.99;
moon.colorSettings.steepSharpness = 10;
moon.updateColors();
moon.attachNode.position.addInPlace(planet.attachNode.getAbsolutePosition());

planets.push(moon);

let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);


let ocean = new OceanPostProcess("ocean", planet.attachNode, radius + 10e2, sun, scene.activeCamera, scene);
ocean.settings.alphaModifier = 0.00002;
ocean.settings.depthModifier = 0.004;
//ocean.settings.oceanRadius = 0;

//let volumetricClouds = new VolumetricCloudsPostProcess("clouds", planet.attachNode, radius + 10e3, radius + 20e3, sun, player.camera, scene);


let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, radius, radius + 30e3, sun, player.camera, scene);
//atmosphere.settings.intensity = 10;
atmosphere.settings.falloffFactor = 20;
atmosphere.settings.scatteringStrength = 0.4;


let fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, scene.activeCamera, BABYLON.Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, { precision: 4 });
    }
    if (e.key == "u") atmosphere.settings.intensity = (atmosphere.settings.intensity == 0) ? 15 : 0;
    if (e.key == "o") ocean.settings.oceanRadius = (ocean.settings.oceanRadius == 0) ? radius + 10e2 : 0;
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w") planet.surfaceMaterial.wireframe = !planet.surfaceMaterial.wireframe;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

let collisionWorker = new CollisionWorker(player);
let collisionWorkerAvailable = true;

collisionWorker.getWorker().onmessage = e => {
    if (player.nearestPlanet == null) return;

    let direction = player.nearestPlanet.getAbsolutePosition().normalizeToNew();
    let currentHeight = player.nearestPlanet.getAbsolutePosition().length();
    let terrainHeight = e.data.h;

    let currentPosition = player.nearestPlanet.attachNode.absolutePosition;
    let newPosition = currentPosition;

    if (currentHeight - player.collisionRadius < terrainHeight) {
        newPosition = direction.scale(terrainHeight + player.collisionRadius);
    }

    let deviation = newPosition.subtract(currentPosition);

    for (const planet of planets) {
        planet.attachNode.position.addInPlace(deviation);
    }
    sun.position.addInPlace(deviation);

    collisionWorkerAvailable = true;
};

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    scene.beforeRender = () => {
        for (const planet of planets) {
            if (player.nearestPlanet == null) player.nearestPlanet = planet;
            else {
                if (planet.attachNode.absolutePosition.lengthSquared() < player.nearestPlanet.attachNode.absolutePosition.lengthSquared()) {
                    player.nearestPlanet = planet;
                }
            }
        }


        let forward = player.getForwardDirection();

        forge.update(depthRenderer);

        planet.update(player.mesh.position, forward, sun.position, scene.activeCamera!);
        moon.update(player.mesh.position, forward, sun.position, scene.activeCamera!);

        if (isMouseEnabled) {
            player.listenToMouse(mouse, engine.getDeltaTime() / 1000);
        }

        gamepad.update();

        gamepad.list();

        let deplacement = player.listenToGamepad(gamepad, engine.getDeltaTime() / 1000);

        //planet.attachNode.rotation.y += 0.0002;

        deplacement.addInPlace(player.listenToKeyboard(keyboard, engine.getDeltaTime() / 1000));

        for (const planet of planets) {
            planet.attachNode.position.addInPlace(deplacement);
        }
        sun.position.addInPlace(deplacement);

        if (collisionWorkerAvailable && player.nearestPlanet != null && player.nearestPlanet.getAbsolutePosition().length() < player.nearestPlanet.radius * 2) {
            collisionWorker.send({
                taskType: "collisionTask",
                planetID: player.nearestPlanet.id,
                terrainSettings: player.nearestPlanet.terrainSettings,
                position: [
                    -player.nearestPlanet.getAbsolutePosition().x,
                    -player.nearestPlanet.getAbsolutePosition().y,
                    -player.nearestPlanet.getAbsolutePosition().z
                ],
                chunkLength: player.nearestPlanet.chunkLength,
                craters: player.nearestPlanet.craters
            } as CollisionData);
            collisionWorkerAvailable = false;
        }


        planet.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        planet.surfaceMaterial.setVector3("planetPosition", planet.attachNode.absolutePosition);

        moon.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        moon.surfaceMaterial.setVector3("planetPosition", moon.attachNode.absolutePosition);
    };

    engine.runRenderLoop(() => scene.render());
});

