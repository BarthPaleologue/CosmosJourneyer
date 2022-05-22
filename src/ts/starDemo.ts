import {
    Engine,
    Scene,
    Texture,
    DepthRenderer,
    Tools,
    FxaaPostProcess,
    VolumetricLightScatteringPostProcess, Vector3
} from "@babylonjs/core";

import UIHTML from "../html/starUI.html";

document.body.innerHTML += UIHTML;

import {Slider} from "handle-sliderjs";

import * as sliderStyle from "handle-sliderjs/dist/css/style2.css";
import * as style from "../styles/style.scss";

import {StarSystemManager} from "./celestialBodies/starSystemManager";
import {PlayerController} from "./player/playerController";
import {Keyboard} from "./inputs/keyboard";
import {StarfieldPostProcess} from "./postProcesses/starfieldPostProcess";
import {Star} from "./celestialBodies/stars/star";
import {Settings} from "./settings";

style.default;
sliderStyle.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight;

let engine = new Engine(canvas, true);
engine.loadingScreen.displayLoadingUI();

let scene = new Scene(engine);

let depthRenderer = new DepthRenderer(scene);
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

let player = new PlayerController(scene);
player.setSpeed(0.2 * Settings.PLANET_RADIUS);
player.camera.maxZ = Settings.PLANET_RADIUS * 20;

let keyboard = new Keyboard();

let starSystemManager = new StarSystemManager();

let starfield = new StarfieldPostProcess("starfield", scene);

let sun = new Star("Weierstrass", Settings.PLANET_RADIUS, starSystemManager, scene);
sun.translate(new Vector3(0, 0, Settings.PLANET_RADIUS * 3));

starfield.setStar(sun);

let fxaa = new FxaaPostProcess("fxaa", 1, scene.activeCamera, Texture.BILINEAR_SAMPLINGMODE);


//#region Sliders

new Slider("temperature", document.getElementById("temperature")!, 3000, 15000, sun.physicalProperties.temperature, (val: number) => {
    sun.physicalProperties.temperature = val;
});

new Slider("exposure", document.getElementById("exposure")!, 0, 200, sun.postProcesses.volumetricLight!.exposure * 100, (val: number) => {
    sun.postProcesses.volumetricLight!.exposure = val / 100;
});

new Slider("decay", document.getElementById("decay")!, 0, 200, sun.postProcesses.volumetricLight!.decay * 100, (val: number) => {
    sun.postProcesses.volumetricLight!.decay = val / 100;
});

//#endregion

document.addEventListener("keyup", e => {
    if (e.key == "p") { // take screenshots
        Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, {precision: 4});
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth - (document.getElementById("ui")?.clientWidth || 0); // on compte le panneau
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        const deltaTime = engine.getDeltaTime() / 1000;

        let deplacement = player.listenToKeyboard(keyboard, deltaTime);

        starSystemManager.translateAllCelestialBody(deplacement);

        starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer, deltaTime);

        scene.render();
    });
});

