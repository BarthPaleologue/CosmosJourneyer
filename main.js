var _a, _b;
import { Planet } from "./components/planet.old.js";
import { Slider } from "./SliderJS-main/slider.js";
let canvas = document.getElementById("renderer");
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
let planet = new Planet("planet", 10, 100, new BABYLON.Vector3(0, 0, 0), true, scene);
let watersphere = BABYLON.Mesh.CreateSphere("water", 32, 10.05, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.diffuseColor = new BABYLON.Color3(0, 0, 1);
//mat.diffuseTexture = new BABYLON.Texture("./textures/water.jpg", scene);
mat.bumpTexture = new BABYLON.Texture("./textures/waterbump.png", scene);
//@ts-ignore
mat.bumpTexture.uScale = 10;
//@ts-ignore
mat.bumpTexture.vScale = 10;
watersphere.material = mat;
watersphere.visibility = 0.6;
let interval = 0;
let c = 0;
new Slider("noiseOffsetX", document.getElementById("noiseOffsetX"), 0, 50, 0, (val) => {
    planet.refreshNoise(undefined, undefined, val / 10);
});
new Slider("noiseOffsetY", document.getElementById("noiseOffsetY"), 0, 50, 0, (val) => {
    planet.refreshNoise(undefined, undefined, undefined, val / 10);
});
new Slider("minValue", document.getElementById("minValue"), 0, 20, 10, (val) => {
    for (let layer of planet.noiseLayers) {
        layer.setModifiers({
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: BABYLON.Vector3.Zero(),
            minValueModifier: val / 10,
        });
    }
});
new Slider("oceanLevel", document.getElementById("oceanLevel"), 0, 10, 5, (val) => {
    watersphere.scaling = new BABYLON.Vector3(1, 1, 1).scale(1 + (val - 5) / 100);
});
new Slider("noiseStrength", document.getElementById("noiseStrength"), 0, 20, 10, (val) => {
    planet.refreshNoise(val / 30);
});
new Slider("noiseFrequency", document.getElementById("noiseFrequency"), 0, 50, 20, (val) => {
    planet.refreshNoise(undefined, val / 100);
});
new Slider("nbCraters", document.getElementById("nbCraters"), 0, 500, 200, (nbCraters) => {
    planet.generateCraters(nbCraters);
});
new Slider("craterRadius", document.getElementById("craterRadius"), 1, 20, 10, (radiusFactor) => {
    planet.refreshCraters(radiusFactor / 10);
});
new Slider("craterSteepness", document.getElementById("craterSteepness"), 1, 20, 15, (steepnessFactor) => {
    planet.refreshCraters(undefined, steepnessFactor / 10);
});
new Slider("craterDepth", document.getElementById("craterDepth"), 1, 20, 10, (depthFactor) => {
    planet.refreshCraters(undefined, undefined, depthFactor / 10);
});
(_a = document.getElementById("randomCraters")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
    planet.generateCraters();
});
let keyboard = {};
document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "r") {
        if (interval != 0)
            clearInterval(interval);
        planet.normalize(planet.radius);
    }
    if (e.key == "v")
        planet.morphToWiggles(5, 0.1);
    if (e.key == "a") {
        if (interval != 0)
            clearInterval(interval);
        c = 0;
        interval = setInterval(() => {
            planet.normalize(planet.radius);
            planet.morphToWiggles(100 * Math.sin(c / 1000), 0.1);
            c++; // L O L
        }, 10);
    }
    if (e.key == "w")
        planet.toggleWireframe();
    if (e.key == "p")
        planet.togglePointsCloud();
});
document.addEventListener("keyup", e => {
    keyboard[e.key] = false;
});
(_b = document.getElementById("random")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
    planet.regenerate(200);
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
