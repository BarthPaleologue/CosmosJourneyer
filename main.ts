import { NoiseModifiers } from "./components/layers/noiseSettings.js";
import { Planet } from "./components/planet.old.js";
import { Slider } from "./SliderJS-main/slider.js";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.collisionsEnabled = true;
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
camera.attachControl(canvas);

scene.activeCamera = camera;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-100, 100, -100), scene);

let planet = new Planet("planet", 10, 100, new BABYLON.Vector3(0, 0, 0), scene);

let watersphere = BABYLON.Mesh.CreateSphere("water", 32, 10.05, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.diffuseColor = new BABYLON.Color3(15, 50, 200).scale(1 / 255);

mat.bumpTexture = new BABYLON.Texture("./textures/waterbump.png", scene);
//@ts-ignore
mat.bumpTexture.uScale = 10;
//@ts-ignore
mat.bumpTexture.vScale = 10;
watersphere.material = mat;
watersphere.visibility = 0.8;

new Slider("noiseOffsetX", document.getElementById("noiseOffsetX")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier.x = val / 10;
    planet.applyTerrain();
});

new Slider("noiseOffsetY", document.getElementById("noiseOffsetY")!, 0, 50, 0, (val: number) => {
    planet.noiseModifiers.offsetModifier.y = val / 10;
    planet.applyTerrain();
});

new Slider("minValue", document.getElementById("minValue")!, 0, 20, 10, (val: number) => {
    planet.noiseModifiers.minValueModifier = val / 10;
    planet.applyTerrain();
});

new Slider("oceanLevel", document.getElementById("oceanLevel")!, 0, 10, 5, (val: number) => {
    watersphere.scaling = new BABYLON.Vector3(1, 1, 1).scale(1 + (val - 5) / 100);
});

new Slider("noiseStrength", document.getElementById("noiseStrength")!, 0, 20, 10, (val: number) => {
    planet.noiseModifiers.strengthModifier = val / 10;
    planet.applyTerrain();
});

new Slider("noiseFrequency", document.getElementById("noiseFrequency")!, 0, 50, 10, (val: number) => {
    planet.noiseModifiers.frequencyModifier = val / 10;
    planet.applyTerrain();
});

new Slider("nbCraters", document.getElementById("nbCraters")!, 0, 500, 200, (nbCraters: number) => {
    planet.regenerateCraters(nbCraters);
    planet.applyTerrain();
});

new Slider("craterRadius", document.getElementById("craterRadius")!, 1, 20, 10, (radiusFactor: number) => {
    planet.craterModifiers.radiusModifier = radiusFactor / 10;
    planet.applyTerrain();
});

new Slider("craterSteepness", document.getElementById("craterSteepness")!, 1, 20, 10, (steepnessFactor: number) => {
    planet.craterModifiers.steepnessModifier = steepnessFactor / 10;
    planet.applyTerrain();
});

new Slider("craterDepth", document.getElementById("craterDepth")!, 1, 20, 10, (depthFactor: number) => {
    planet.craterModifiers.maxDepthModifier = depthFactor / 10;
    planet.applyTerrain();
});

document.getElementById("randomCraters")?.addEventListener("click", () => {
    planet.regenerateCraters();
    planet.applyTerrain();
});

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "r") planet.normalize(planet.radius);
    if (e.key == "w") planet.toggleWireframe();
    if (e.key == "p") planet.togglePointsCloud();
});

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
        planet.mesh.rotation.y += .002;
        watersphere.rotation.y += .002;
        scene.render();
    });
});

