var _a;
import { AtmosphericScatteringPostProcess } from "./atmosphericScattering.js";
import { Slider } from "./SliderJS-main/slider.js";
let canvas = document.getElementById("renderer");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();
let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
let orbitalCamera = new BABYLON.ArcRotateCamera("orbitalCamera", Math.PI / 2, Math.PI / 3, 200, BABYLON.Vector3.Zero(), scene);
let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, -200), scene);
freeCamera.keysUp.push(90, 87); // z,w
freeCamera.keysLeft.push(81, 65); // q,a
freeCamera.keysDown.push(83); // s
freeCamera.keysRight.push(68); // d
freeCamera.keysUpward.push(32); // space
freeCamera.keysDownward.push(16); // shift
let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);
let sun = BABYLON.Mesh.CreateSphere("Sun", 32, 10, scene);
let vls1 = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, freeCamera, sun, 100);
let vls2 = new BABYLON.VolumetricLightScatteringPostProcess("trueLight2", 1, orbitalCamera, sun, 100);
let sunMaterial = new BABYLON.StandardMaterial("sunMaterial", scene);
sunMaterial.emissiveTexture = new BABYLON.Texture("./textures/sun.jpg", scene);
sun.material = sunMaterial;
light.parent = sun;
const planetRadius = 50;
const atmosphereRadius = 55;
let earth = BABYLON.Mesh.CreateSphere("Earth", 32, planetRadius * 2, scene);
let earthMaterial = new BABYLON.StandardMaterial("earthMaterial", scene);
earthMaterial.diffuseTexture = new BABYLON.Texture("./textures/earth.jpg", scene);
earthMaterial.emissiveTexture = new BABYLON.Texture("./textures/night2.jpg", scene);
earthMaterial.specularTexture = new BABYLON.Texture("./textures/specular2.jpg", scene);
earth.material = earthMaterial;
// The important line
let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", earth, planetRadius, atmosphereRadius, sun, freeCamera, scene);
function switchCamera(newCamera) {
    var _a;
    (_a = scene.activeCamera) === null || _a === void 0 ? void 0 : _a.detachControl(canvas);
    scene.activeCamera = newCamera;
    newCamera.attachControl(canvas);
    //Call this function to use one atmosphere for all cameras
    atmosphere.setCamera(newCamera);
}
switchCamera(orbitalCamera);
// cloud layer just above ground level
let epsilon = 1e-1;
let cloudLayer = BABYLON.Mesh.CreateSphere("clouds", 32, (planetRadius + epsilon) * 2, scene);
let cloudMaterial = new BABYLON.StandardMaterial("cloudMaterial", scene);
cloudMaterial.opacityTexture = new BABYLON.Texture("./textures/clouds4.jpg", scene);
cloudMaterial.opacityTexture.getAlphaFromRGB = true;
cloudLayer.material = cloudMaterial;
cloudLayer.parent = earth;
earth.rotation.x = Math.PI; // textures are always upside down on sphere for some reason...
orbitalCamera.setTarget(earth);
//#region Sliders
new Slider("intensity", document.getElementById("intensity"), 0, 40, atmosphere.settings.intensity, (val) => {
    atmosphere.settings.intensity = val;
});
new Slider("atmosphereRadius", document.getElementById("atmosphereRadius"), planetRadius + 1, 100, atmosphereRadius, (val) => {
    atmosphere.settings.atmosphereRadius = val;
});
new Slider("scatteringStrength", document.getElementById("scatteringStrength"), 0, 40, atmosphere.settings.scatteringStrength * 10, (val) => {
    atmosphere.settings.scatteringStrength = val / 10;
});
new Slider("falloff", document.getElementById("falloff"), 0, 30, atmosphere.settings.falloffFactor, (val) => {
    atmosphere.settings.falloffFactor = val;
});
new Slider("density", document.getElementById("density"), 0, 30, atmosphere.settings.densityModifier * 10, (val) => {
    atmosphere.settings.densityModifier = val / 10;
});
new Slider("redWaveLength", document.getElementById("redWaveLength"), 0, 1000, atmosphere.settings.redWaveLength, (val) => {
    atmosphere.settings.redWaveLength = val;
});
new Slider("greenWaveLength", document.getElementById("greenWaveLength"), 0, 1000, atmosphere.settings.greenWaveLength, (val) => {
    atmosphere.settings.greenWaveLength = val;
});
new Slider("blueWaveLength", document.getElementById("blueWaveLength"), 0, 1000, atmosphere.settings.blueWaveLength, (val) => {
    atmosphere.settings.blueWaveLength = val;
});
let sunOrientation = 180;
new Slider("sunOrientation", document.getElementById("sunOrientation"), 1, 360, sunOrientation, (val) => {
    sunOrientation = val;
});
let rotationSpeed = 1;
new Slider("planetRotation", document.getElementById("planetRotation"), 0, 20, rotationSpeed * 10, (val) => {
    rotationSpeed = Math.pow((val / 10), 5);
});
//#endregion
(_a = document.getElementById("switchView")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
    if (scene.activeCamera == freeCamera)
        switchCamera(orbitalCamera);
    else
        switchCamera(freeCamera);
});
document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera, { precision: 4 });
    }
    else if (e.key == "f") {
        console.log(Math.round(engine.getFps()));
    }
    else if (e.key == "c") {
        if (scene.activeCamera == freeCamera)
            switchCamera(orbitalCamera);
        else
            switchCamera(freeCamera);
    }
});
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});
window.addEventListener("wheel", () => {
    console.log(orbitalCamera.radius - planetRadius);
});
scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        let sunRadians = (sunOrientation / 360) * 2 * Math.PI;
        sun.position = new BABYLON.Vector3(100 * Math.cos(sunRadians), 50, 100 * Math.sin(sunRadians));
        earth.rotation.y += -engine.getDeltaTime() * rotationSpeed / 100000;
        cloudLayer.rotation.y = engine.getDeltaTime() * rotationSpeed / 500000;
        scene.render();
    });
});
