import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { Planet } from "./components/planet/planet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";
import { CloudPostProcess } from "./components/postProcesses/cloudPostProcess";
import { ChunkForge } from "./components/forge/chunkForge";

import sunTexture from "../asset/textures/sun.jpg";

import * as style from "../styles/style.scss";

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

let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.minZ = 1;
freeCamera.attachControl(canvas);

let box = BABYLON.Mesh.CreateBox("boate", 1, scene);
freeCamera.parent = box;

box.rotate(freeCamera.getDirection(BABYLON.Axis.Y), -1, BABYLON.Space.WORLD);

scene.activeCamera = freeCamera;

let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);

const radius = 200 * 1e3; // diamètre en m
freeCamera.maxZ = Math.max(radius * 50, 10000);

let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.2 * radius, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture(sunTexture, scene);
sun.material = mat;
light.parent = sun;
sun.position.x = -1718573.25;
sun.position.z = -65566.6171875;
depthRenderer.getDepthMap().renderList?.push(sun);

let forge = new ChunkForge(64);

function getMaxDepthFromRadius(r: number): number {
    return Math.round(Math.log2(radius) - 12);
}

let planet = new Planet("Hécate", radius, new BABYLON.Vector3(0, 0, 4 * radius), 1, getMaxDepthFromRadius(radius), forge, scene);
planet.noiseModifiers.archipelagoFactor = 0.5;
planet.colorSettings.plainColor = new BABYLON.Vector3(0.1, 0.4, 0);
planet.colorSettings.sandSize = 300;
planet.colorSettings.steepSharpness = 8;
planet.colorSettings.waterLevel = 10e2;
planet.updateColors();
planet.attachNode.position.x = radius * 5;

let moon = new Planet("Manaleth", radius / 4, new BABYLON.Vector3(Math.cos(-0.7), 0, Math.sin(-0.7)).scale(3 * radius), 1, getMaxDepthFromRadius(radius / 4), forge, scene);
moon.noiseModifiers.archipelagoFactor = 1;
moon.colorSettings.plainColor = new BABYLON.Vector3(0.5, 0.5, 0.5);
moon.colorSettings.sandColor = planet.colorSettings.steepColor;
moon.colorSettings.steepColor = new BABYLON.Vector3(0.1, 0.1, 0.1);
moon.colorSettings.snowLatitudePersistence = 2;
moon.colorSettings.snowElevation01 = 0.99;
moon.colorSettings.steepSharpness = 10;
moon.craterModifiers.maxDepthModifier = 1 / 8;
moon.updateColors();

moon.attachNode.parent = planet.attachNode;
planet.attachNode.parent = sun;

let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);

let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet.attachNode, radius - 20e3, radius + 40e3, sun, freeCamera, scene);
atmosphere.settings.intensity = 10;
atmosphere.settings.falloffFactor = 20;
atmosphere.settings.scatteringStrength = 0.4;
//let depth = new DepthPostProcess("depth", freeCamera, scene);

let ocean = new OceanPostProcess("ocean", planet.attachNode, radius + 10e2, sun, freeCamera, scene);
ocean.settings.alphaModifier = 0.00002;
ocean.settings.depthModifier = 0.004;
//ocean.settings.oceanRadius = 0;

//let clouds = new CloudPostProcess("clouds", planet.attachNode, radius + 5e3, radius + 10e3, sun, freeCamera, scene);

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, { precision: 4 });
    }
    if (e.key == "m")
        console.log(sun.absolutePosition, freeCamera.rotation);
});

document.addEventListener("keyup", e => keyboard[e.key] = false);

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    let t = 0;
    let speed = 0.0002 * radius;

    scene.beforeRender = () => {
        let forward = freeCamera.getDirection(BABYLON.Axis.Z);
        let upward = freeCamera.getDirection(BABYLON.Axis.Y);
        let right = freeCamera.getDirection(BABYLON.Axis.X);

        forge.update(depthRenderer);

        planet.update(freeCamera.position, forward, sun.position, freeCamera);
        moon.update(freeCamera.position, forward, sun.position, freeCamera);

        if (keyboard["a"]) { // rotation autour de l'axe de déplacement
            box.rotate(forward, 0.02, BABYLON.Space.WORLD);
        } else if (keyboard["e"]) {
            box.rotate(forward, -0.02, BABYLON.Space.WORLD);
        }
        if (keyboard["i"]) {
            box.rotate(right, -0.02, BABYLON.Space.WORLD);
        } else if (keyboard["k"]) {
            box.rotate(right, 0.02, BABYLON.Space.WORLD);
        }
        if (keyboard["j"]) {
            box.rotate(upward, -0.02, BABYLON.Space.WORLD);
        } else if (keyboard["l"]) {
            box.rotate(upward, 0.02, BABYLON.Space.WORLD);
        }

        let deplacement = BABYLON.Vector3.Zero();

        if (keyboard["z"]) deplacement.subtractInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["s"]) deplacement.addInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["q"]) deplacement.addInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard["d"]) deplacement.subtractInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard[" "]) deplacement.subtractInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["Shift"]) deplacement.addInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["+"]) speed *= 1.1;
        if (keyboard["-"]) speed /= 1.1;
        if (keyboard["8"]) speed = 0.03;

        sun.position.addInPlace(deplacement);

        t += 0.00002;
        /*
        sun.rotation.y = -t;*/
        //planet.attachNode.rotation.x = -40 * t;
        //planet.attachNode.rotation.y = -50 * t;
        //moon.attachNode.rotation.y = -20 * t;


        planet.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        planet.surfaceMaterial.setVector3("planetPosition", planet.attachNode.absolutePosition);
        moon.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        moon.surfaceMaterial.setVector3("planetPosition", moon.attachNode.absolutePosition);
    };

    engine.runRenderLoop(() => {
        scene.render();
    });
});

