import { AtmosphericScatteringPostProcess } from "./atmosphericScattering.js";
import { Slider } from "./SliderJS-main/slider.js";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

//let freeCamera = new BABYLON.ArcRotateCamera("freeCamera", Math.PI / 2, Math.PI / 3, 200, new BABYLON.Vector3(0, 0, 0), scene);
let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, -200), scene);
freeCamera.attachControl(canvas);

scene.activeCamera = freeCamera;

let depth_renderer = scene.enableDepthRenderer();

let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);

let sun = BABYLON.Mesh.CreateSphere("tester", 32, 10, scene);
let mat2 = new BABYLON.StandardMaterial("mat", scene);
mat2.emissiveTexture = new BABYLON.Texture("./textures/sun.jpg", scene);
sun.material = mat2;
light.parent = sun;

sun.position = new BABYLON.Vector3(-100, 50, 0);
let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);


const diameter = 100;
const atmDiameter = 150;

let cube = BABYLON.Mesh.CreateSphere("tester", 32, diameter, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.diffuseTexture = new BABYLON.Texture("./textures/earth.jpg", scene);
mat.emissiveTexture = new BABYLON.Texture("./textures/night2.jpg", scene);
cube.material = mat;
cube.position.y = 0;
cube.rotation.x = Math.PI;

//freeCamera.setTarget(cube);

let postProcess = new AtmosphericScatteringPostProcess("atmosphere", cube, diameter / 2, atmDiameter / 2, sun, freeCamera);

new Slider("intensity", document.getElementById("intensity")!, 0, 40, 10, (val: number) => {
    postProcess.modifiers.intensityModifier = val / 10;
});

new Slider("atmosphereRadius", document.getElementById("atmosphereRadius")!, 0, 40, 10, (val: number) => {
    postProcess.modifiers.atmosphereRadiusModifier = val / 10;
});


new Slider("betaRayleigh", document.getElementById("betaRayleigh")!, 0, 40, 10, (val: number) => {
    postProcess.modifiers.intensityModifier = val / 10;
});

new Slider("falloff", document.getElementById("falloff")!, 0, 30, 10, (val: number) => {
    postProcess.modifiers.falloffModifier = val ** 5.4 / 10;
});

new Slider("maxHeight", document.getElementById("maxHeight")!, 0, 30, 10, (val: number) => {
    postProcess.modifiers.maxHeightModifier = val ** 1000 / 10;
});

new Slider("rayleighScale", document.getElementById("rayleighScale")!, 0, 30, 10, (val: number) => {
    postProcess.modifiers.rayleighScaleModifier = val / 10;
});

new Slider("mieScale", document.getElementById("mieScale")!, 0, 30, 10, (val: number) => {
    postProcess.modifiers.mieScaleModifier = val ** 1.5 / 10;
});

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
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

    let t = 0;

    engine.runRenderLoop(() => {

        if (keyboard["t"]) {
            t += engine.getDeltaTime() / 1000;
            sun.position = new BABYLON.Vector3(100 * Math.cos(t), 50, 100 * Math.sin(t));
            cube.position = new BABYLON.Vector3(30 * Math.cos(t), 0, 30 * Math.sin(t));
        }

        scene.render();
    });
});

