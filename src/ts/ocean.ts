import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";
import { Planet } from "./components/planet/planet";
import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { ChunkForge } from "./components/forge/chunkForge";

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

let camera = new BABYLON.FreeCamera("camera", BABYLON.Vector3.Zero(), scene);
camera.position = (new BABYLON.Vector3(0, 0, -15));
//camera.wheelPrecision = 10;
camera.attachControl(canvas);

scene.activeCamera = camera;

const planetRadius = 10;
const oceanRadius = 11;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-100, 100, -100), scene);

let center = BABYLON.Mesh.CreateBox("boate", 1, scene);

let forge = new ChunkForge(64, depthRenderer, scene);

let planet = new Planet("Gaia", planetRadius, new BABYLON.Vector3(0, 0, 0), 64, 0, 1, forge, scene);
planet.setRenderDistanceFactor(10);
planet.craterModifiers.maxDepthModifier = 0.00005;
planet.noiseModifiers.frequencyModifier = 20;
planet.noiseModifiers.offsetModifier = [23, 10, 0];
let waterLevel = 0.85;
planet.colorSettings = {
    snowColor: new BABYLON.Vector3(1, 1, 1),
    steepColor: new BABYLON.Vector3(0.2, 0.2, 0.2),
    plainColor: new BABYLON.Vector3(0.1, 0.4, 0),
    sandColor: new BABYLON.Vector3(0.5, 0.5, 0),
    waterLevel: waterLevel,
    sandSize: 1,
    steepSharpness: 1
};
planet.updateColors();


let ocean = new OceanPostProcess("ocean", center, oceanRadius, light, camera, scene);
let atm = new AtmosphericScatteringPostProcess("atmosphere", center, planetRadius, 20, light, camera, scene);

//#region Sliders

new Slider("oceanRadius", document.getElementById("oceanRadius")!, 0, 20, 10, (val: number) => {
    ocean.settings.oceanRadius = 10 + val / 10;
});

new Slider("alphaModifier", document.getElementById("alphaModifier")!, 0, 500, ocean.settings.alphaModifier * 100, (val: number) => {
    ocean.settings.alphaModifier = val / 100;
});

new Slider("depthModifier", document.getElementById("depthModifier")!, 0, 40, ocean.settings.depthModifier * 10, (val: number) => {
    ocean.settings.depthModifier = val / 10;
});

//#endregion

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
        planet.chunkForge.update();

        planet.update(camera.position, camera.getDirection(BABYLON.Axis.Z), light.position, camera);

        scene.render();
    });
});

