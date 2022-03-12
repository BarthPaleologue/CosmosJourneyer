import { Engine, Texture, Scene, Color4, DepthRenderer, Axis, Space, Vector3, Tools, FxaaPostProcess, VolumetricLightScatteringPostProcess } from "@babylonjs/core";

import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { SolidPlanet } from "./components/celestialBodies/planets/solid/solidPlanet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";

import * as style from "../styles/style.scss";
import { PlayerController } from "./components/player/playerController";
import { Keyboard } from "./components/inputs/keyboard";
import { Mouse } from "./components/inputs/mouse";
import { Gamepad } from "./components/inputs/gamepad";
import { CollisionWorker } from "./components/workers/collisionWorker";
import { StarSystemManager } from "./components/celestialBodies/starSystemManager";

import { FlatCloudsPostProcess } from "./components/postProcesses/flatCloudsPostProcess";
import { RingsPostProcess } from "./components/postProcesses/ringsPostProcess";
import { centeredRandom, nrand, randInt } from "./components/toolbox/random";
import { StarfieldPostProcess } from "./components/postProcesses/starfieldPostProcess";
import { Star } from "./components/celestialBodies/stars/star";
style.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new Engine(canvas);
engine.loadingScreen.displayLoadingUI();

console.log("GPU utilisé : " + engine.getGlInfo().renderer);

let scene = new Scene(engine);
scene.clearColor = new Color4(0, 0, 0, 1);

let depthRenderer = new DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

const radius = 1000 * 1e3; // diamètre en m

let keyboard = new Keyboard();
let mouse = new Mouse();
let gamepad = new Gamepad();

let player = new PlayerController(scene);
player.setSpeed(0.2 * radius);
player.mesh.rotate(player.camera.getDirection(Axis.Y), 0.45, Space.WORLD);

player.camera.maxZ = Math.max(radius * 50, 10000);



let starSystemManager = new StarSystemManager(128);

let sun = new Star("Weierstrass", 0.4 * radius, scene);

sun.mesh.position.x = -913038.375;
sun.mesh.position.z = -1649636.25;
starSystemManager.addStar(sun);

let starfield = new StarfieldPostProcess("starfield", sun, scene);


let planet = new SolidPlanet("Hécate", radius, new Vector3(0, 0, 4 * radius), 1, scene, {
    minTemperature: randInt(-50, 5),
    maxTemperature: randInt(10, 50),
    pressure: Math.max(nrand(1, 0.5), 0),
    waterAmount: Math.max(nrand(1, 0.6), 0),
}, [
    centeredRandom(),
    centeredRandom(),
    centeredRandom()
]);
console.log("seed : ", planet.getSeed().toString());
console.table(planet.physicalProperties);
planet.colorSettings.plainColor = new Vector3(0.22, 0.37, 0.024).add(new Vector3(centeredRandom(), centeredRandom(), centeredRandom()).scale(0.1));
planet.colorSettings.sandSize = 250 + 100 * centeredRandom();
planet.colorSettings.steepSharpness = 3;
planet.terrainSettings.continentsFragmentation = nrand(0.5, 0.2);

let waterElevation = 20e2 * planet.physicalProperties.waterAmount;
planet.colorSettings.waterLevel = waterElevation;

planet.updateColors();
planet.attachNode.position.x = radius * 2;
planet.attachNode.rotate(Axis.X, centeredRandom(), Space.WORLD);

let ocean = new OceanPostProcess("ocean", planet, radius + waterElevation, sun, player.camera, scene);

if (planet.physicalProperties.waterAmount > 0 && planet.physicalProperties.pressure > 0) {
    let flatClouds = new FlatCloudsPostProcess("clouds", planet, radius + 15e3, sun, player.camera, scene);
    flatClouds.settings.cloudPower = 10 * Math.exp(-planet.physicalProperties.waterAmount * planet.physicalProperties.pressure);
}

if (planet.physicalProperties.pressure > 0) {
    let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, radius + 100e3 * planet.physicalProperties.pressure, sun, player.camera, scene);
    atmosphere.settings.intensity = 15 * planet.physicalProperties.pressure;
    atmosphere.settings.falloffFactor = 24;
    atmosphere.settings.scatteringStrength = 1.0;
}

let rings = new RingsPostProcess("rings", planet, sun, player.camera, scene);
rings.settings.ringStart = 1.8 + 0.4 * centeredRandom();
rings.settings.ringEnd = 2.5 + 0.4 * centeredRandom();

starSystemManager.addSolidPlanet(planet);

let vls = new VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun.mesh, 100);

let fxaa = new FxaaPostProcess("fxaa", 1, player.camera, Texture.BILINEAR_SAMPLINGMODE);

let isMouseEnabled = false;

document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
    }
    if (e.key == "m") isMouseEnabled = !isMouseEnabled;
    if (e.key == "w" && player.nearestBody != null) (<SolidPlanet><unknown>player.nearestBody).surfaceMaterial.wireframe = !(<SolidPlanet><unknown>player.nearestBody).surfaceMaterial.wireframe;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});



depthRenderer.getDepthMap().renderList?.push(sun.mesh);

let collisionWorker = new CollisionWorker(player, starSystemManager);

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    scene.beforeRender = () => {
        player.nearestBody = starSystemManager.getNearestPlanet();
        // si trop loin on osef
        if (player.nearestBody != null && player.nearestBody.getAbsolutePosition().length() > player.nearestBody.getRadius() * 2) {
            player.nearestBody = null;
        }

        starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer);

        if (isMouseEnabled) {
            player.listenToMouse(mouse, engine.getDeltaTime() / 1000);
        }

        gamepad.update();

        let deplacement = player.listenToGamepad(gamepad, engine.getDeltaTime() / 1000);

        deplacement.addInPlace(player.listenToKeyboard(keyboard, engine.getDeltaTime() / 1000));

        starSystemManager.translateAllCelestialBody(deplacement);

        if (!collisionWorker.isBusy() && player.nearestBody != null) {
            if(player.nearestBody instanceof SolidPlanet) {
                //FIXME: se passer de instanceof
                collisionWorker.checkCollision(player.nearestBody);
            }
        }
    };

    engine.runRenderLoop(() => scene.render());
});

