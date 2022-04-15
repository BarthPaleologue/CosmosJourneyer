import {
    Engine,
    Scene,
    Color4,
    Texture,
    DepthRenderer,
    Tools,
    FxaaPostProcess,
    VolumetricLightScatteringPostProcess, Vector3
} from "@babylonjs/core";

import * as style from "../styles/style.scss";
import * as style2 from "../sliderjs/style2.min.css";
import {StarSystemManager} from "./components/celestialBodies/starSystemManager";
import {PlayerController} from "./components/player/playerController";
import {Keyboard} from "./components/inputs/keyboard";
import {StarfieldPostProcess} from "./components/postProcesses/starfieldPostProcess";
import {Star} from "./components/celestialBodies/stars/star";

style.default;
style2.default;

// TODO: euh oui alors si on prend en compte la physique tout doit changer par ici mdr

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight;

let engine = new Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new Scene(engine);
scene.clearColor = new Color4(0, 0, 0, 1);

let depthRenderer = new DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

const starRadius = 500e3;

let player = new PlayerController(scene);
player.setSpeed(0.2 * starRadius);
player.camera.maxZ = starRadius * 20;

let keyboard = new Keyboard();

let starSystemManager = new StarSystemManager();

let sun = new Star("Weierstrass", starRadius, new Vector3(0, 0, starRadius * 3), scene);

starSystemManager.addStar(sun);

let starfield = new StarfieldPostProcess("starfield", sun, scene);

let fxaa = new FxaaPostProcess("fxaa", 1, scene.activeCamera, Texture.BILINEAR_SAMPLINGMODE);

let vls = new VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun.mesh, 100);
vls.exposure = 1.0;
vls.decay = 0.95;

//#region Sliders

new Slider("temperature", document.getElementById("temperature")!, 3000, 15000, sun.physicalProperties.temperature, (val: number) => {
    sun.physicalProperties.temperature = val;
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

        let deplacement = player.listenToKeyboard(keyboard, engine.getDeltaTime() / 1000);

        starSystemManager.translateAllCelestialBody(deplacement);

        starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer, engine.getDeltaTime() / 1000);

        scene.render();
    });
});

