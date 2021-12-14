import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { SolidPlanet } from "./components/planet/solid/planet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";
import { VolumetricCloudsPostProcess } from "./components/postProcesses/volumetricCloudsPostProcess";

import sunTexture from "../asset/textures/sun.jpg";

import * as style from "../styles/style.scss";
import { PlayerControler } from "./components/player/playerControler";
import { Keyboard } from "./components/inputs/keyboard";
import { Mouse } from "./components/inputs/mouse";
import { Gamepad } from "./components/inputs/gamepad";
import { CollisionWorker } from "./components/workers/collisionWorker";
import { PlanetManager } from "./components/planet/planetManager";

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
player.mesh.rotate(player.camera.getDirection(BABYLON.Axis.Y), 0.6, BABYLON.Space.WORLD);

player.camera.maxZ = Math.max(radius * 50, 10000);

let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.4 * radius, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture(sunTexture, scene);
sun.material = mat;
sun.position.x = -913038.375;
sun.position.z = -1649636.25;
depthRenderer.getDepthMap().renderList?.push(sun);

let planetManager = new PlanetManager();

let waterElevation = 20e2;

let planet = new SolidPlanet("Hécate", radius, new BABYLON.Vector3(0, 0, 4 * radius), 1, scene);
planet.colorSettings.plainColor = new BABYLON.Vector3(0.1, 0.4, 0).scale(0.7).add(new BABYLON.Vector3(0.5, 0.3, 0.08).scale(0.3));
planet.colorSettings.sandSize = 300;
planet.colorSettings.steepSharpness = 2;
planet.colorSettings.waterLevel = waterElevation;

planet.updateColors();
planet.attachNode.position.x = radius * 5;

planetManager.add(planet);

let moon = new SolidPlanet("Manaleth", radius / 4, new BABYLON.Vector3(Math.cos(2.5), 0, Math.sin(2.5)).scale(3 * radius), 1, scene);
moon.terrainSettings.continentsFragmentation = 1;
moon.terrainSettings.maxMountainHeight = 5e3;
moon.colorSettings.plainColor = new BABYLON.Vector3(0.5, 0.5, 0.5);
moon.colorSettings.sandColor = moon.colorSettings.plainColor.scale(0.5);
moon.colorSettings.steepColor = new BABYLON.Vector3(0.1, 0.1, 0.1);
moon.colorSettings.snowLatitudePersistence = 2;
moon.colorSettings.snowElevation01 = 0.6;
moon.colorSettings.snowOffsetAmplitude = 0.02;
moon.colorSettings.steepSharpness = 3;
moon.updateColors();

import rockn from "../asset/textures/rockn.png";
import { FlatCloudsPostProcess } from "./components/postProcesses/flatCloudsPostProcess";
moon.surfaceMaterial.setTexture("plainNormalMap", new BABYLON.Texture(rockn, scene));
moon.surfaceMaterial.setTexture("bottomNormalMap", new BABYLON.Texture(rockn, scene));
moon.surfaceMaterial.setTexture("sandNormalMap", new BABYLON.Texture(rockn, scene));

moon.attachNode.position.addInPlace(planet.attachNode.getAbsolutePosition());

planetManager.add(moon);

let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun, 100);


let ocean = new OceanPostProcess("ocean", planet.attachNode, radius + waterElevation, sun, player.camera, scene);
ocean.settings.alphaModifier = 0.00002;
ocean.settings.depthModifier = 0.004;
//ocean.settings.oceanRadius = 0;

//let volumetricClouds = new VolumetricCloudsPostProcess("clouds", planet.attachNode, radius + 10e3, radius + 20e3, sun, player.camera, scene);
let flatClouds = new FlatCloudsPostProcess("clouds", planet.attachNode, radius, waterElevation, radius + 15e3, sun, player.camera, scene);

let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, radius, radius + 100e3, sun, player.camera, scene);
atmosphere.settings.intensity = 20;
atmosphere.settings.falloffFactor = 24;
atmosphere.settings.scatteringStrength = 1.0;


let fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, player.camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
    }
    if (e.key == "u") atmosphere.settings.intensity = (atmosphere.settings.intensity == 0) ? 15 : 0;
    if (e.key == "o") ocean.settings.oceanRadius = (ocean.settings.oceanRadius == 0) ? radius + waterElevation : 0;
    if (e.key == "y") flatClouds.settings.cloudLayerRadius = (flatClouds.settings.cloudLayerRadius == 0) ? radius + 15e3 : 0;
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

        //planet.attachNode.rotation.y += 0.0002;

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

