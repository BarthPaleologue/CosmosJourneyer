import { Engine, Scene, Color3, Color4, Texture, DepthRenderer, Axis, Space, Vector3, PointLight, Tools, FxaaPostProcess} from "@babylonjs/core";

import { AtmosphericScatteringPostProcess } from "./components/postProcesses/atmosphericScatteringPostProcess";
import { SolidPlanet } from "./components/celestialBodies/planets/solid/solidPlanet";
import { OceanPostProcess } from "./components/postProcesses/oceanPostProcess";

import * as style from "../styles/style.scss";
import * as style2 from "../sliderjs/style2.min.css";
import { StarSystemManager } from "./components/celestialBodies/starSystemManager";
import { PlayerController } from "./components/player/playerController";
import { FlatCloudsPostProcess } from "./components/postProcesses/flatCloudsPostProcess";
import { RingsPostProcess } from "./components/postProcesses/RingsPostProcess";
import { Keyboard } from "./components/inputs/keyboard";
import { StarfieldPostProcess } from "./components/postProcesses/starfieldPostProcess";

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


let light = new PointLight("light", new Vector3(-1, 1, -1).scale(planetRadius * 10), scene);

let starfield = new StarfieldPostProcess("starfield", player, light, scene);


let planetManager = new StarSystemManager();

let planet = new SolidPlanet("Gaia", planetRadius, Vector3.Zero(), 2, scene);
planet.attachNode.position.z = planetRadius * 3;
planet.attachNode.rotation.x = -0.2;

let waterElevation = 20e2;

planet.colorSettings.steepSharpness = 3;
planet.colorSettings.plainColor = new Vector3(0.1, 0.4, 0).scale(0.7).add(new Vector3(0.5, 0.3, 0.08).scale(0.3));

planet.colorSettings.sandSize = 300;
planet.colorSettings.waterLevel = waterElevation;

planet.updateColors();

planetManager.addSolidPlanet(planet);


let ocean = new OceanPostProcess("ocean", planet.attachNode, planetRadius + waterElevation, light, player.camera, scene);

let flatClouds = new FlatCloudsPostProcess("clouds", planet.attachNode, planetRadius, waterElevation, planetRadius + 15e3, light, player.camera, scene);

let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, planetRadius, planetRadius + 100e3, light, player.camera, scene);
atmosphere.settings.intensity = 20;
atmosphere.settings.scatteringStrength = 1.0;
atmosphere.settings.falloffFactor = 24;

let rings = new RingsPostProcess("rings", planet.attachNode, planetRadius, waterElevation, light, player.camera, scene);


let fxaa = new FxaaPostProcess("fxaa", 1, scene.activeCamera, Texture.BILINEAR_SAMPLINGMODE);

//#region Sliders

new Slider("zoom", document.getElementById("zoom")!, 0, 100, 100 * planet._radius / planet.attachNode.position.z, (value: number) => {
    planet.attachNode.position.z = 100 * planet._radius / (value);
});


document.getElementById("oceanToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[0] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    ocean.settings.oceanRadius = checkbox.checked ? planetRadius + waterElevation : 0;
});

new Slider("oceanLevel", document.getElementById("oceanLevel")!, 0, 100, (ocean.settings.oceanRadius - planetRadius) / 100, (val: number) => {
    ocean.settings.oceanRadius = planetRadius + val * 100;
    if (val == 0) ocean.settings.oceanRadius = 0;
    planet.colorSettings.waterLevel = val * 100;
    planet.updateColors();
});


new Slider("alphaModifier", document.getElementById("alphaModifier")!, 0, 200, ocean.settings.alphaModifier * 10000, (val: number) => {
    ocean.settings.alphaModifier = val / 10000;
});

new Slider("depthModifier", document.getElementById("depthModifier")!, 0, 70, ocean.settings.depthModifier * 10000, (val: number) => {
    ocean.settings.depthModifier = val / 10000;
});

function babylonToHex(color: Vector3): string {
    let c2 = new Color3(color.x, color.y, color.z);
    console.log(c2.toHexString());
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

new Slider("snowElevation", document.getElementById("snowElevation")!, 0, 100, planet.colorSettings.snowElevation01 * 100, (val: number) => {
    planet.colorSettings.snowElevation01 = val / 100;
    planet.updateColors();
});

new Slider("snowOffsetAmplitude", document.getElementById("snowOffsetAmplitude")!, 0, 100, planet.colorSettings.snowOffsetAmplitude * 100, (val: number) => {
    planet.colorSettings.snowOffsetAmplitude = val / 100;
    planet.updateColors();
});

new Slider("snowLacunarity", document.getElementById("snowLacunarity")!, 0, 100, planet.colorSettings.snowLacunarity * 10, (val: number) => {
    planet.colorSettings.snowLacunarity = val / 10;
    planet.updateColors();
});

new Slider("snowLatitudePersistence", document.getElementById("snowLatitudePersistence")!, 0, 100, planet.colorSettings.snowLatitudePersistence, (val: number) => {
    planet.colorSettings.snowLatitudePersistence = val;
    planet.updateColors();
});

new Slider("steepSnowDotLimit", document.getElementById("steepSnowDotLimit")!, 0, 10, planet.colorSettings.steepSnowDotLimit * 10, (val: number) => {
    planet.colorSettings.steepSnowDotLimit = val / 10;
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

        planetManager.moveEverything(deplacement);

        planet.attachNode.rotate(Axis.Y, .001 * rotationSpeed, Space.LOCAL);

        light.position = new Vector3(Math.cos(sunOrientation * Math.PI / 180), 0, Math.sin(sunOrientation * Math.PI / 180)).scale(planetRadius * 10);
        light.position.addInPlace(planet.attachNode.getAbsolutePosition());

        planetManager.update(player, light.getAbsolutePosition(), depthRenderer);

        scene.render();
    });
});

