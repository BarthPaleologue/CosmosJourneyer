import { Planet } from "./components/planet.js";
import { Slider } from "./SliderJS-main/slider.js";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
camera.wheelPrecision = 10;
camera.attachControl(canvas);

scene.activeCamera = camera;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-100, 100, -100), scene);

let planet = new Planet("Gaia", 5, new BABYLON.Vector3(0, 0, 0), 64, 1, scene);
planet.setRenderDistanceFactor(10);
planet.noiseModifiers.strengthModifier = 0.7;
planet.noiseModifiers.offsetModifier = [23, 10, 0];
let waterLevel = 0.85;
planet.colorSettings = {
    snowColor: new BABYLON.Vector4(1, 1, 1, 1),
    steepColor: new BABYLON.Vector4(0.2, 0.2, 0.2, 1),
    plainColor: new BABYLON.Vector4(0.1, 0.4, 0, 1),
    sandColor: new BABYLON.Vector4(0.5, 0.5, 0, 1),
    plainSteepDotLimit: 0.95,
    snowSteepDotLimit: 0.94,
    iceCapThreshold: 20,
    waterLevel: waterLevel,
    sandSize: 1,
};
planet.updateColors();

let watersphere = BABYLON.Mesh.CreateSphere("water", 32, 10 + planet.colorSettings.waterLevel, scene);
let mat = new BABYLON.StandardMaterial("mat2", scene);
mat.diffuseColor = new BABYLON.Color3(15, 50, 200).scale(1 / 255);

mat.bumpTexture = new BABYLON.Texture("./textures/waterbump.png", scene);
//@ts-ignore
mat.bumpTexture.uScale = 10;
//@ts-ignore
mat.bumpTexture.vScale = 10;
watersphere.material = mat;
watersphere.visibility = 0.8;

let rotationSpeedFactor = 1;

new Slider("rotationSpeed", document.getElementById("rotationSpeed")!, 0, 10, 1, (val: number) => {
    rotationSpeedFactor = val ** 2;
});

new Slider("maxDepth", document.getElementById("maxDepth")!, 0, 5, 1, (val: number) => {
    planet.setMaxDepth(val);
});

new Slider("noiseOffsetX", document.getElementById("noiseOffsetX")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier[0] = val / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("noiseOffsetY", document.getElementById("noiseOffsetY")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier[1] = val / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("noiseOffsetZ", document.getElementById("noiseOffsetZ")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier[2] = val / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("minValue", document.getElementById("minValue")!, 0, 20, 10, (val: number) => {
    planet.noiseModifiers.minValueModifier = val / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("oceanLevel", document.getElementById("oceanLevel")!, 0, 15, 5, (val: number) => {
    watersphere.scaling = new BABYLON.Vector3(1, 1, 1).scale(1 + (val - 5) / 100);
    planet.colorSettings.waterLevel = waterLevel * (1 + (val - 5) / 8);
    planet.updateColors();
});

new Slider("sandSize", document.getElementById("sandSize")!, 0, 40, planet.colorSettings.sandSize, (val: number) => {
    planet.colorSettings.sandSize = val;
    planet.updateColors();
});

new Slider("snowThreshold", document.getElementById("snowThreshold")!, 0, 40, planet.colorSettings.iceCapThreshold, (val: number) => {
    planet.colorSettings.iceCapThreshold = val;
    planet.updateColors();
});

new Slider("noiseStrength", document.getElementById("noiseStrength")!, 0, 20, planet.noiseModifiers.strengthModifier * 10, (val: number) => {
    planet.noiseModifiers.strengthModifier = val / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("noiseFrequency", document.getElementById("noiseFrequency")!, 0, 50, 10, (val: number) => {
    planet.noiseModifiers.frequencyModifier = val / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("nbCraters", document.getElementById("nbCraters")!, 0, 500, 200, (nbCraters: number) => {
    //planet.regenerateCraters(nbCraters);
    planet.updateSettings();
});

new Slider("craterRadius", document.getElementById("craterRadius")!, 1, 20, 10, (radiusFactor: number) => {
    planet.craterModifiers.radiusModifier = radiusFactor / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("craterSteepness", document.getElementById("craterSteepness")!, 1, 20, 10, (steepnessFactor: number) => {
    planet.craterModifiers.steepnessModifier = steepnessFactor / 10;
    planet.updateSettings();
    planet.reset();
});

new Slider("craterDepth", document.getElementById("craterDepth")!, 1, 20, 10, (depthFactor: number) => {
    planet.craterModifiers.maxDepthModifier = depthFactor / 10;
    planet.updateSettings();
    planet.reset();
});

document.getElementById("randomCraters")?.addEventListener("click", () => {
    //planet.regenerateCraters();
    planet.updateSettings();
});

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keyup", e => {
    keyboard[e.key] = false;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        planet.attachNode.rotation.y += .001 * rotationSpeedFactor;
        watersphere.rotation.y += .001 * rotationSpeedFactor;

        planet.chunkForge.update();
        planet.update(BABYLON.Vector3.Zero(), camera.getDirection(BABYLON.Axis.Z), light.position);

        scene.render();
    });
});

