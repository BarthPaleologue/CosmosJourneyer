import { AtmosphericScatteringPostProcess } from "./postProcesses/atmosphericScatteringPostProcess.js";
import { Planet } from "./components/planet.js";
import { OceanPostProcess } from "./postProcesses/oceanPostProcess.js";
import { CloudPostProcess } from "./postProcesses/cloudPostProcess.js";
import { ChunkForge } from "./components/forge/chunkForge.js";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let depthRenderer = new BABYLON.DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.minZ = 1;
freeCamera.attachControl(canvas);
freeCamera.checkCollisions = true;


let box = BABYLON.Mesh.CreateBox("boate", 1, scene);
freeCamera.parent = box;

box.rotate(freeCamera.getDirection(BABYLON.Axis.Y), -1, BABYLON.Space.WORLD);

scene.activeCamera = freeCamera;

let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);

const radius = 200 * 1e3; // diamètre en m
freeCamera.maxZ = Math.max(radius * 50, 10000);

let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.2 * radius, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture("./textures/sun.jpg", scene);
sun.material = mat;
light.parent = sun;
sun.position.x = -1718573.25;
sun.position.z = -65566.6171875;
depthRenderer.getDepthMap().renderList?.push(sun);

let forge = new ChunkForge(64, depthRenderer, scene);

let planet = new Planet("Arès", radius, new BABYLON.Vector3(0, 0, 4 * radius), 64, 1, 6, forge, scene);
planet.colorSettings.sandColor = planet.colorSettings.steepColor;
planet.colorSettings.iceCapThreshold = 5;
//planet.colorSettings.plainColor = new BABYLON.Vector4(0.4, 0.4, 0.4, 1);
//planet.colorSettings.plainColor = new BABYLON.Vector4(0.0, 154 / 255, 23 / 255, 1.0);
//planet.colorSettings.plainColor = new BABYLON.Vector4(0.0, 154 / 255, 23 / 255, 1.0);
planet.noiseModifiers.amplitudeModifier = 5000; // sert à rien
planet.noiseModifiers.frequencyModifier = 0.0003;
planet.updateColors();
planet.attachNode.position.x = radius * 5;
//planet.attachNode.parent = sun;

let moon = new Planet("Manaleth", radius / 8, new BABYLON.Vector3(Math.cos(-0.7), 0, Math.sin(-0.7)).scale(3 * radius), 64, 1, 6, forge, scene);
moon.colorSettings.sandColor = planet.colorSettings.steepColor;
moon.colorSettings.plainColor = new BABYLON.Vector4(0.4, 0.4, 0.4, 1);
//planet.colorSettings.plainColor = new BABYLON.Vector4(0.0, 154 / 255, 23 / 255, 1.0);
//planet.colorSettings.plainColor = new BABYLON.Vector4(0.0, 154 / 255, 23 / 255, 1.0);
moon.colorSettings.iceCapThreshold = radius / 2;
moon.noiseModifiers.amplitudeModifier = 10;
moon.noiseModifiers.frequencyModifier = 0.0004;
moon.craterModifiers.maxDepthModifier = 1 / 8;
moon.updateColors();

moon.attachNode.parent = planet.attachNode;
planet.attachNode.parent = sun;

let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);

let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet.attachNode, radius - 15e3, radius + 30e3, sun, freeCamera, scene);
atmosphere.settings.intensity = 15;
atmosphere.settings.falloffFactor = 20;
//let depth = new DepthPostProcess("depth", freeCamera, scene);

let ocean = new OceanPostProcess("ocean", planet.attachNode, radius + 3e3, sun, freeCamera, scene);
ocean.settings.alphaModifier = 0.00005;
ocean.settings.depthModifier = 0.002;
//ocean.settings.oceanRadius = 0;

//let clouds = new CloudPostProcess("clouds", planet.attachNode, radius + 5e3, radius + 10e3, sun, freeCamera, scene);

let keyboard: { [key: string]: boolean; } = { };

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, { precision: 4 });
    }
    if (e.key == "r") {
        planet.noiseModifiers.strengthModifier = Math.random() * 3;
        planet.reset();
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

    scene.beforeRender = () => {
        let forward = freeCamera.getDirection(BABYLON.Axis.Z);
        let upward = freeCamera.getDirection(BABYLON.Axis.Y);
        let right = freeCamera.getDirection(BABYLON.Axis.X);

        forge.update();

        planet.update(freeCamera.position, forward, sun.position, freeCamera);
        moon.update(freeCamera.position, forward, sun.position, freeCamera);
        //planet.attachNode.rotation.y += 0.0001;

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
        if (keyboard["+"]) speed += 1;
        if (keyboard["-"]) speed -= 1;
        if (keyboard["8"]) speed = 0.03;

        sun.position.addInPlace(deplacement);
        //moon.attachNode.position.addInPlace(deplacement);

        t += 0.00002;
        //sun.position = planet.attachNode.position.add(new BABYLON.Vector3(Math.cos(t), 0, Math.sin(t)).scale(4 * radius));

        planet.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        planet.surfaceMaterial.setVector3("planetPosition", planet.attachNode.absolutePosition);
        moon.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        moon.surfaceMaterial.setVector3("planetPosition", moon.attachNode.absolutePosition);
    };

    let speed = 0.0002 * radius;

    engine.runRenderLoop(() => {
        scene.render();
    });
});

