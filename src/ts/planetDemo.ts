import {
    Engine,
    Scene,
    Color3,
    Color4,
    Texture,
    DepthRenderer,
    Axis,
    Space,
    Vector3,
    Tools,
    FxaaPostProcess,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";

import { AtmosphericScatteringPostProcess } from "./components/postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { SolidPlanet } from "./components/celestialBodies/planets/solid/solidPlanet";
import { OceanPostProcess } from "./components/postProcesses/planetPostProcesses/oceanPostProcess";

import * as style from "../styles/style.scss";
import * as style2 from "../sliderjs/style2.min.css";
import { StarSystemManager } from "./components/celestialBodies/starSystemManager";
import { PlayerController } from "./components/player/playerController";
import { FlatCloudsPostProcess } from "./components/postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { RingsPostProcess } from "./components/postProcesses/planetPostProcesses/ringsPostProcess";
import { Keyboard } from "./components/inputs/keyboard";
import { StarfieldPostProcess } from "./components/postProcesses/starfieldPostProcess";
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

const planetRadius = 1000e3;


let player = new PlayerController(scene);
player.setSpeed(0.2 * planetRadius);
player.camera.maxZ = planetRadius * 20;

let keyboard = new Keyboard();


let starSystemManager = new StarSystemManager();

let sun = new Star("Weierstrass", 0.4 * planetRadius, new Vector3(-1, 0.5, -1).scale(planetRadius * 5), scene);

starSystemManager.addStar(sun);

let starfield = new StarfieldPostProcess("starfield", sun, scene);


let planet = new SolidPlanet("Gaia", planetRadius, Vector3.Zero(), 2, scene);
planet.attachNode.position.z = planetRadius * 3;
planet.attachNode.rotation.x = -0.2;

planet.colorSettings.steepSharpness = 3;
planet.colorSettings.plainColor = new Vector3(0.1, 0.4, 0).scale(0.7).add(new Vector3(0.5, 0.3, 0.08).scale(0.3));

planet.colorSettings.sandSize = 300;

planet.updateColors();

starSystemManager.addSolidPlanet(planet);


let ocean = new OceanPostProcess("ocean", planet, sun, scene);

let flatClouds = new FlatCloudsPostProcess("clouds", planet, planetRadius + 15e3, sun, scene);

let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, planetRadius + 100e3, sun, scene);

let rings = new RingsPostProcess("rings", planet, sun, scene);

let fxaa = new FxaaPostProcess("fxaa", 1, scene.activeCamera, Texture.BILINEAR_SAMPLINGMODE);

let vls = new VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun.mesh, 100);
vls.exposure = 1.0;
vls.decay = 0.95;

//#region Sliders

new Slider("zoom", document.getElementById("zoom")!, 0, 100, 100 * planet._radius / planet.attachNode.position.z, (value: number) => {
    planet.attachNode.position.z = 100 * planet._radius / (value);
});


document.getElementById("oceanToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[0] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    ocean.settings.oceanRadius = checkbox.checked ? planet.getRadius() : 0;
});

new Slider("alphaModifier", document.getElementById("alphaModifier")!, 0, 200, ocean.settings.alphaModifier * 10000, (val: number) => {
    ocean.settings.alphaModifier = val / 10000;
});

new Slider("depthModifier", document.getElementById("depthModifier")!, 0, 70, ocean.settings.depthModifier * 10000, (val: number) => {
    ocean.settings.depthModifier = val / 10000;
});

function babylonToHex(color: Vector3): string {
    let c2 = new Color3(color.x, color.y, color.z);
    return c2.toHexString();
}

let snowColorPicker = document.getElementById("snowColor") as HTMLInputElement;
snowColorPicker.value = babylonToHex(planet.colorSettings.snowColor);
snowColorPicker.addEventListener("input", () => {
    let color = Color3.FromHexString(snowColorPicker.value);
    planet.colorSettings.snowColor = new Vector3(color.r, color.g, color.b);
    planet.updateColors();
});

let plainColorPicker = document.getElementById("plainColor") as HTMLInputElement;
plainColorPicker.value = babylonToHex(planet.colorSettings.plainColor);
plainColorPicker.addEventListener("input", () => {
    let color = Color3.FromHexString(plainColorPicker.value);
    planet.colorSettings.plainColor = new Vector3(color.r, color.g, color.b);
    planet.updateColors();
});

let steepColorPicker = document.getElementById("steepColor") as HTMLInputElement;
steepColorPicker.value = babylonToHex(planet.colorSettings.steepColor);
steepColorPicker.addEventListener("input", () => {
    let color = Color3.FromHexString(steepColorPicker.value);
    planet.colorSettings.steepColor = new Vector3(color.r, color.g, color.b);
    planet.updateColors();
});

let sandColorPicker = document.getElementById("sandColor") as HTMLInputElement;
sandColorPicker.value = babylonToHex(planet.colorSettings.sandColor);
sandColorPicker.addEventListener("input", () => {
    let color = Color3.FromHexString(sandColorPicker.value);
    planet.colorSettings.sandColor = new Vector3(color.r, color.g, color.b);
    planet.updateColors();
});

new Slider("sandSize", document.getElementById("sandSize")!, 0, 300, planet.colorSettings.sandSize / 10, (val: number) => {
    planet.colorSettings.sandSize = val * 10;
    planet.updateColors();
});

new Slider("steepSharpness", document.getElementById("steepSharpness")!, 0, 50, planet.colorSettings.steepSharpness * 10, (val: number) => {
    planet.colorSettings.steepSharpness = val / 10;
    planet.updateColors();
});

new Slider("normalSharpness", document.getElementById("normalSharpness")!, 0, 30, planet.colorSettings.normalSharpness * 10, (val: number) => {
    planet.colorSettings.normalSharpness = val / 10;
    planet.updateColors();
});

document.getElementById("cloudsToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[1] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    flatClouds.settings.cloudLayerRadius = checkbox.checked ? planetRadius + 15e3 : 0;
});

new Slider("cloudFrequency", document.getElementById("cloudFrequency")!, 0, 20, flatClouds.settings.cloudFrequency, (val: number) => {
    flatClouds.settings.cloudFrequency = val;
});

new Slider("cloudDetailFrequency", document.getElementById("cloudDetailFrequency")!, 0, 50, flatClouds.settings.cloudDetailFrequency, (val: number) => {
    flatClouds.settings.cloudDetailFrequency = val;
});

new Slider("cloudPower", document.getElementById("cloudPower")!, 0, 100, flatClouds.settings.cloudPower * 10, (val: number) => {
    flatClouds.settings.cloudPower = val / 10;
});

new Slider("worleySpeed", document.getElementById("worleySpeed")!, 0.0, 200.0, flatClouds.settings.worleySpeed * 10, (val: number) => {
    flatClouds.settings.worleySpeed = val / 10;
});

new Slider("detailSpeed", document.getElementById("detailSpeed")!, 0, 200, flatClouds.settings.detailSpeed * 10, (val: number) => {
    flatClouds.settings.detailSpeed = val / 10;
});

document.getElementById("atmosphereToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    atmosphere.settings.atmosphereRadius = checkbox.checked ? planetRadius + 100e3 : 0;
});

new Slider("intensity", document.getElementById("intensity")!, 0, 40, atmosphere.settings.intensity, (val: number) => {
    atmosphere.settings.intensity = val;
});

new Slider("atmosphereRadius", document.getElementById("atmosphereRadius")!, 0, 100, (atmosphere.settings.atmosphereRadius - planetRadius) / 10000, (val: number) => {
    atmosphere.settings.atmosphereRadius = planetRadius + val * 10000;
});


new Slider("scatteringStrength", document.getElementById("scatteringStrength")!, 0, 40, atmosphere.settings.scatteringStrength * 10, (val: number) => {
    atmosphere.settings.scatteringStrength = val / 10;
});

new Slider("falloff", document.getElementById("falloff")!, -10, 200, atmosphere.settings.falloffFactor, (val: number) => {
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

document.getElementById("ringsToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[3] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    rings.settings.ringFrequency = checkbox.checked ? 30 : 0;
});

new Slider("ringsMinRadius", document.getElementById("ringsMinRadius")!, 100, 200, rings.settings.ringStart * 100, (val: number) => {
    rings.settings.ringStart = val / 100;
});

new Slider("ringsMaxRadius", document.getElementById("ringsMaxRadius")!, 150, 400, rings.settings.ringEnd * 100, (val: number) => {
    rings.settings.ringEnd = val / 100;
});

new Slider("ringsFrequency", document.getElementById("ringsFrequency")!, 10, 100, rings.settings.ringFrequency, (val: number) => {
    rings.settings.ringFrequency = val;
});

new Slider("ringsOpacity", document.getElementById("ringsOpacity")!, 0, 100, rings.settings.ringOpacity * 100, (val: number) => {
    rings.settings.ringOpacity = val / 100;
});

let sunOrientation = 220;
new Slider("sunOrientation", document.getElementById("sunOrientation")!, 1, 360, sunOrientation, (val: number) => {
    sun.mesh.rotateAround(planet.getAbsolutePosition(), new Vector3(0,1,0), -2*Math.PI*(val - sunOrientation)/360);
    sunOrientation = val;
});

let rotationSpeed = 0.5;
new Slider("planetRotation", document.getElementById("planetRotation")!, 0, 20, rotationSpeed * 10, (val: number) => {
    rotationSpeed = (val / 10) ** 5;
});

new Slider("cameraFOV", document.getElementById("cameraFOV")!, 0, 360, player.camera.fov * 360 / Math.PI, (val: number) => {
    player.camera.fov = val * Math.PI / 360;
});

//#endregion

document.getElementById("randomCraters")?.addEventListener("click", () => {
    //planet.regenerateCraters();
});

document.addEventListener("keyup", e => {
    if (e.key == "p") { // take screenshots
        Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, { precision: 4 });
    }
    if (e.key == "w") {
        planet.surfaceMaterial.wireframe = !planet.surfaceMaterial.wireframe;
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

        planet.attachNode.rotate(Axis.Y, .001 * rotationSpeed, Space.LOCAL);

        starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer);

        scene.render();
    });
});

