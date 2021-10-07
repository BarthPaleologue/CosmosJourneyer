import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { Planet } from "./components/planet/planet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";
import { ChunkForge } from "./components/forge/chunkForge";

import * as style from "../styles/style.scss";
import * as style2 from "../sliderjs/style2.min.css";

style.default;
style2.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let depthRenderer = new BABYLON.DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

const planetRadius = 200e3;

let camera = new BABYLON.FreeCamera("camera", BABYLON.Vector3.Zero(), scene);
camera.maxZ = planetRadius * 5;
scene.activeCamera = camera;


//let rpp = new BABYLON.DefaultRenderingPipeline("rpp", true, scene, [camera]);
//rpp.fxaaEnabled = true;
//rpp.fxaa = new BABYLON.FxaaPostProcess("fxaa", 4, camera);

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-1, 1, -1).scale(planetRadius * 2), scene);

let forge = new ChunkForge(64);

let planet = new Planet("Gaia", planetRadius, new BABYLON.Vector3(0, 0, planetRadius * 3), 64, 0, 2, forge, scene);
//planet.setRenderDistanceFactor(3);

let waterElevation = 10e2;

planet.colorSettings.plainColor = new BABYLON.Vector3(0.1, 0.4, 0);

planet.updateColors();


let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet.attachNode, planetRadius - 15e3, planetRadius + 30e3, light, camera, scene);
atmosphere.settings.intensity = 10;
atmosphere.settings.scatteringStrength = 0.5;
atmosphere.settings.falloffFactor = 20;

let ocean = new OceanPostProcess("ocean", planet.attachNode, planetRadius + waterElevation, light, camera, scene);
ocean.settings.alphaModifier = 0.00002;
ocean.settings.depthModifier = 0.004;

//#region Sliders

new Slider("maxDepth", document.getElementById("maxDepth")!, 0, 5, 1, (val: number) => {
    planet.setMinDepth(val);
});

new Slider("noiseOffsetX", document.getElementById("noiseOffsetX")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier[0] = val / 10;
    planet.reset();
});

new Slider("noiseOffsetY", document.getElementById("noiseOffsetY")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier[1] = val / 10;
    planet.reset();
});

new Slider("noiseOffsetZ", document.getElementById("noiseOffsetZ")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier[2] = val / 10;
    planet.reset();
});

new Slider("minValue", document.getElementById("minValue")!, 0, 20, 10, (val: number) => {
    planet.noiseModifiers.minValueModifier = val / 10;
    planet.reset();
});

new Slider("oceanLevel", document.getElementById("oceanLevel")!, 0, 50, (ocean.settings.oceanRadius - planetRadius) / 100, (val: number) => {
    ocean.settings.oceanRadius = planetRadius + val * 100;
    if (val == 0) ocean.settings.oceanRadius = 0;
    planet.colorSettings.waterLevel = val * 100;
    planet.updateColors();
});


new Slider("alphaModifier", document.getElementById("alphaModifier")!, 0, 40, ocean.settings.alphaModifier * 100000, (val: number) => {
    ocean.settings.alphaModifier = val / 100000;
});

new Slider("depthModifier", document.getElementById("depthModifier")!, 0, 70, ocean.settings.depthModifier * 10000, (val: number) => {
    ocean.settings.depthModifier = val / 10000;
});

new Slider("sandSize", document.getElementById("sandSize")!, 0, 1000, planet.colorSettings.sandSize, (val: number) => {
    planet.colorSettings.sandSize = val;
    planet.updateColors();
});

new Slider("steepSharpness", document.getElementById("steepSharpness")!, 0, 256, planet.colorSettings.steepSharpness, (val: number) => {
    planet.colorSettings.steepSharpness = val;
    planet.updateColors();
});

new Slider("noiseFrequency", document.getElementById("noiseFrequency")!, 0, 20, planet.noiseModifiers.frequencyModifier * 10, (val: number) => {
    planet.noiseModifiers.frequencyModifier = val / 10;
    planet.reset();
});

new Slider("nbCraters", document.getElementById("nbCraters")!, 0, 500, 200, (nbCraters: number) => {
    //planet.regenerateCraters(nbCraters);
});

new Slider("craterRadius", document.getElementById("craterRadius")!, 1, 20, 10, (radiusFactor: number) => {
    planet.craterModifiers.radiusModifier = radiusFactor / 10;
    planet.reset();
});

new Slider("craterSteepness", document.getElementById("craterSteepness")!, 1, 20, 10, (steepnessFactor: number) => {
    planet.craterModifiers.steepnessModifier = steepnessFactor / 10;
    planet.reset();
});

new Slider("craterDepth", document.getElementById("craterDepth")!, 1, 20, 10, (depthFactor: number) => {
    planet.craterModifiers.maxDepthModifier = depthFactor / 10;
    planet.reset();
});

new Slider("intensity", document.getElementById("intensity")!, 0, 40, atmosphere.settings.intensity, (val: number) => {
    atmosphere.settings.intensity = val;
});

new Slider("atmosphereRadius", document.getElementById("atmosphereRadius")!, 0, 100, (atmosphere.settings.atmosphereRadius - planetRadius) / 1000, (val: number) => {
    atmosphere.settings.atmosphereRadius = planetRadius + val * 1000;
});


new Slider("scatteringStrength", document.getElementById("scatteringStrength")!, 0, 40, atmosphere.settings.scatteringStrength * 10, (val: number) => {
    atmosphere.settings.scatteringStrength = val / 10;
});

new Slider("falloff", document.getElementById("falloff")!, 0, 30, atmosphere.settings.falloffFactor, (val: number) => {
    atmosphere.settings.falloffFactor = val;
});

new Slider("redWaveLength", document.getElementById("redWaveLength")!, 0, 1000, atmosphere.settings.redWaveLength, (val: number) => {
    atmosphere.settings.redWaveLength = val;
});

new Slider("greenWaveLength", document.getElementById("greenWaveLength")!, 0, 1000, atmosphere.settings.greenWaveLength, (val: number) => {
    atmosphere.settings.greenWaveLength = val;
});

new Slider("blueWaveLength", document.getElementById("blueWaveLength")!, 0, 1000, atmosphere.settings.blueWaveLength, (val: number) => {
    atmosphere.settings.blueWaveLength = val;
});

let sunOrientation = 180;
new Slider("sunOrientation", document.getElementById("sunOrientation")!, 1, 360, sunOrientation, (val: number) => {
    sunOrientation = val;
});

let rotationSpeed = 1;
new Slider("planetRotation", document.getElementById("planetRotation")!, 0, 20, rotationSpeed * 10, (val: number) => {
    rotationSpeed = (val / 10) ** 5;
});
//#endregion

document.getElementById("randomCraters")?.addEventListener("click", () => {
    //planet.regenerateCraters();
});

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keyup", e => {
    keyboard[e.key] = false;
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, { precision: 4 });
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        planet.attachNode.rotation.y += .001 * rotationSpeed;

        planet.chunkForge.update(depthRenderer);
        planet.update(BABYLON.Vector3.Zero(), camera.getDirection(BABYLON.Axis.Z), light.position, camera);

        light.position = new BABYLON.Vector3(Math.cos(sunOrientation * Math.PI / 180), 0, Math.sin(sunOrientation * Math.PI / 180)).scale(planetRadius * 5);

        scene.render();
    });
});

