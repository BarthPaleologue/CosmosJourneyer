import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { Planet } from "./components/planet/planet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";
import { VolumetricCloudsPostProcess } from "./components/postProcesses/volumetricCloudsPostProcess";
import { ChunkForge } from "./components/forge/chunkForge";

import sunTexture from "../asset/textures/sun.jpg";

import * as style from "../styles/style.scss";
import { Player } from "./components/player/player";

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

const radius = 200 * 1e3; // diamètre en m

let player = new Player(scene);
player.speed = 0.2 * radius;
player.mesh.rotate(player.firstPersonCamera.getDirection(BABYLON.Axis.Y), -1, BABYLON.Space.WORLD);

player.activeCamera.maxZ = Math.max(radius * 50, 10000);
scene.activeCamera = player.activeCamera;


let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.2 * radius, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture(sunTexture, scene);
sun.material = mat;
sun.position.x = -1718573.25;
sun.position.z = -65566.6171875;
depthRenderer.getDepthMap().renderList?.push(sun);

let forge = new ChunkForge(64);

let planet = new Planet("Hécate", radius, new BABYLON.Vector3(0, 0, 4 * radius), 1, forge, scene);
planet.colorSettings.plainColor = new BABYLON.Vector3(0.1, 0.4, 0);
planet.colorSettings.sandSize = 300;
planet.colorSettings.steepSharpness = 8;
planet.colorSettings.waterLevel = 10e2;
planet.updateColors();
planet.attachNode.position.x = radius * 5;

let moon = new Planet("Manaleth", radius / 4, new BABYLON.Vector3(Math.cos(-0.7), 0, Math.sin(-0.7)).scale(3 * radius), 1, forge, scene);
moon.terrainSettings.continentsFragmentation = 0;
moon.colorSettings.plainColor = new BABYLON.Vector3(0.5, 0.5, 0.5);
moon.colorSettings.sandColor = planet.colorSettings.steepColor;
moon.colorSettings.steepColor = new BABYLON.Vector3(0.1, 0.1, 0.1);
moon.colorSettings.snowLatitudePersistence = 2;
moon.colorSettings.snowElevation01 = 0.99;
moon.colorSettings.steepSharpness = 10;
moon.updateColors();

moon.attachNode.parent = planet.attachNode;
planet.attachNode.parent = sun;

let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);

let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet.attachNode, radius - 20e3, radius + 40e3, sun, player.firstPersonCamera, scene);
atmosphere.settings.intensity = 10;
atmosphere.settings.falloffFactor = 20;
atmosphere.settings.scatteringStrength = 0.4;
//let volumetricClouds = new VolumetricCloudsPostProcess("clouds", planet.attachNode, radius + 60e3, radius + 80e3, sun, freeCamera, scene);

let ocean = new OceanPostProcess("ocean", planet.attachNode, radius + 10e2, sun, scene.activeCamera, scene);
ocean.settings.alphaModifier = 0.00002;
ocean.settings.depthModifier = 0.004;
//ocean.settings.oceanRadius = 0;

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, { precision: 4 });
    }
    if (e.key == "m")
        console.log(sun.absolutePosition, player.mesh.rotation);
});

document.addEventListener("keyup", e => keyboard[e.key] = false);

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    scene.beforeRender = () => {
        let forward = player.getForwardDirection();

        forge.update(depthRenderer);

        planet.update(player.mesh.position, forward, sun.position, scene.activeCamera!);
        moon.update(player.mesh.position, forward, sun.position, scene.activeCamera!);

        let deplacement = player.listenToKeyboard(keyboard, engine.getDeltaTime() / 1000);
        sun.position.addInPlace(deplacement);

        planet.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        planet.surfaceMaterial.setVector3("planetPosition", planet.attachNode.absolutePosition);

        moon.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        moon.surfaceMaterial.setVector3("planetPosition", moon.attachNode.absolutePosition);
    };

    engine.runRenderLoop(() => scene.render());
});

