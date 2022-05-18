import {
    Axis,
    Color3,
    DepthRenderer,
    Engine,
    FxaaPostProcess,
    Scene,
    Tools,
    Vector3,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";

import {ColorMode, SolidPlanet} from "./celestialBodies/planets/solidPlanet";

import {Slider} from "handle-sliderjs";

import * as sliderStyle from "handle-sliderjs/dist/css/style2.css";
import * as style from "../styles/style.scss";

import {StarSystemManager} from "./celestialBodies/starSystemManager";
import {PlayerController} from "./player/playerController";
import {Keyboard} from "./inputs/keyboard";
import {StarfieldPostProcess} from "./postProcesses/starfieldPostProcess";
import {Star} from "./celestialBodies/stars/star";
import {Settings} from "./settings";

import {BodyEditor, EditorVisibility} from "./ui/bodyEditor";

let bodyEditor = new BodyEditor(EditorVisibility.FULL);

style.default;
sliderStyle.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
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

let starSystemManager = new StarSystemManager(Settings.VERTEX_RESOLUTION);

let sun = new Star("Weierstrass", 0.4 * Settings.PLANET_RADIUS, starSystemManager, scene);
sun.translate(new Vector3(-1, 0.5, -1).scale(Settings.PLANET_RADIUS * 5));

let starfield = new StarfieldPostProcess("starfield", sun, scene);

let planet = new SolidPlanet("Hécate", Settings.PLANET_RADIUS, starSystemManager, scene);
planet.rotate(Axis.X, 0.2);

planet.physicalProperties.rotationPeriod /= 500;

planet.translate(new Vector3(0, 0, planet.getRadius() * 3));

let ocean = planet.createOcean(sun, scene);
let flatClouds = planet.createClouds(Settings.CLOUD_LAYER_HEIGHT, sun, scene);
let atmosphere = planet.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, sun, scene);
let rings = planet.createRings(sun, scene);

bodyEditor.setBody(planet);

let fxaa = new FxaaPostProcess("fxaa", 1, scene.activeCamera);

let vls = new VolumetricLightScatteringPostProcess("trueLight", 1, player.camera, sun.mesh, 100);
vls.exposure = 1.0;
vls.decay = 0.95;

//#region Sliders

//#region general

bodyEditor.generalSliders.push(new Slider("zoom", document.getElementById("zoom")!, 0, 100, 100 * planet._radius / planet.attachNode.position.z, (value: number) => {
    let playerDir = planet.getAbsolutePosition().normalizeToNew();
    planet.setAbsolutePosition(playerDir.scale(100 * planet.getRadius() / value));
}));

let sunOrientation = 220;
bodyEditor.generalSliders.push(new Slider("sunOrientation", document.getElementById("sunOrientation")!, 1, 360, sunOrientation, (val: number) => {
    sun.mesh.rotateAround(planet.getAbsolutePosition(), new Vector3(0, 1, 0), -2 * Math.PI * (val - sunOrientation) / 360);
    sunOrientation = val;
}));

let axialTilt = 0.2;
bodyEditor.generalSliders.push(new Slider("axialTilt", document.getElementById("axialTilt")!, -180, 180, Math.round(180 * axialTilt / Math.PI), (val: number) => {
    let newAxialTilt = val * Math.PI / 180;
    planet.rotate(Axis.X, newAxialTilt - axialTilt);
    if (player.isOrbiting()) player.rotateAround(planet.getAbsolutePosition(), Axis.X, newAxialTilt - axialTilt);
    axialTilt = newAxialTilt;
}));

bodyEditor.generalSliders.push(new Slider("cameraFOV", document.getElementById("cameraFOV")!, 0, 360, player.camera.fov * 360 / Math.PI, (val: number) => {
    player.camera.fov = val * Math.PI / 360;
}));

//#endregion general

//#region surface

let snowColorPicker = document.getElementById("snowColor") as HTMLInputElement;
snowColorPicker.value = planet.colorSettings.snowColor.toHexString();
snowColorPicker.addEventListener("input", () => {
    planet.colorSettings.snowColor = Color3.FromHexString(snowColorPicker.value);
    planet.updateColors();
});

let plainColorPicker = document.getElementById("plainColor") as HTMLInputElement;
plainColorPicker.value = planet.colorSettings.plainColor.toHexString();
plainColorPicker.addEventListener("input", () => {
    planet.colorSettings.plainColor = Color3.FromHexString(plainColorPicker.value);
    planet.updateColors();
});

let steepColorPicker = document.getElementById("steepColor") as HTMLInputElement;
steepColorPicker.value = planet.colorSettings.steepColor.toHexString();
steepColorPicker.addEventListener("input", () => {
    planet.colorSettings.steepColor = Color3.FromHexString(steepColorPicker.value);
    planet.updateColors();
});

let sandColorPicker = document.getElementById("sandColor") as HTMLInputElement;
sandColorPicker.value = planet.colorSettings.beachColor.toHexString();
sandColorPicker.addEventListener("input", () => {
    planet.colorSettings.beachColor = Color3.FromHexString(sandColorPicker.value);
    planet.updateColors();
});

let desertColorPicker = document.getElementById("desertColor") as HTMLInputElement;
desertColorPicker.value = planet.colorSettings.desertColor.toHexString();
desertColorPicker.addEventListener("input", () => {
    planet.colorSettings.desertColor = Color3.FromHexString(desertColorPicker.value);
    planet.updateColors();
});


bodyEditor.surfaceSliders.push(new Slider("sandSize", document.getElementById("sandSize")!, 0, 300, planet.colorSettings.beachSize / 10, (val: number) => {
    planet.colorSettings.beachSize = val * 10;
    planet.updateColors();
}));

bodyEditor.surfaceSliders.push(new Slider("steepSharpness", document.getElementById("steepSharpness")!, 0, 100, planet.colorSettings.steepSharpness * 10, (val: number) => {
    planet.colorSettings.steepSharpness = val / 10;
    planet.updateColors();
}));

bodyEditor.surfaceSliders.push(new Slider("normalSharpness", document.getElementById("normalSharpness")!, 0, 100, planet.colorSettings.normalSharpness * 100, (val: number) => {
    planet.colorSettings.normalSharpness = val / 100;
    planet.updateColors();
}));

//#endregion surface

//#region atmosphere

document.getElementById("atmosphereToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    atmosphere.settings.atmosphereRadius = checkbox.checked ? Settings.PLANET_RADIUS + Settings.ATMOSPHERE_HEIGHT : 0;
});

bodyEditor.atmosphereSliders.push(new Slider("intensity", document.getElementById("intensity")!, 0, 40, atmosphere.settings.intensity, (val: number) => {
    atmosphere.settings.intensity = val;
}));

bodyEditor.atmosphereSliders.push(new Slider("density", document.getElementById("density")!, 0, 40, atmosphere.settings.densityModifier * 10, (val: number) => {
    atmosphere.settings.densityModifier = val / 10;
}));

bodyEditor.atmosphereSliders.push(new Slider("atmosphereRadius", document.getElementById("atmosphereRadius")!, 0, 100, (atmosphere.settings.atmosphereRadius - planet.getRadius()) / 10000, (val: number) => {
    atmosphere.settings.atmosphereRadius = planet.getRadius() + val * 10000;
}));

bodyEditor.atmosphereSliders.push(new Slider("rayleighStrength", document.getElementById("rayleighStrength")!, 0, 40, atmosphere.settings.rayleighStrength * 10, (val: number) => {
    atmosphere.settings.rayleighStrength = val / 10;
}));

bodyEditor.atmosphereSliders.push(new Slider("mieStrength", document.getElementById("mieStrength")!, 0, 40, atmosphere.settings.mieStrength * 10, (val: number) => {
    atmosphere.settings.mieStrength = val / 10;
}));

bodyEditor.atmosphereSliders.push(new Slider("falloff", document.getElementById("falloff")!, -10, 200, atmosphere.settings.falloffFactor, (val: number) => {
    atmosphere.settings.falloffFactor = val;
}));

bodyEditor.atmosphereSliders.push(new Slider("redWaveLength", document.getElementById("redWaveLength")!, 0, 1000, atmosphere.settings.redWaveLength, (val: number) => {
    atmosphere.settings.redWaveLength = val;
}));

bodyEditor.atmosphereSliders.push(new Slider("greenWaveLength", document.getElementById("greenWaveLength")!, 0, 1000, atmosphere.settings.greenWaveLength, (val: number) => {
    atmosphere.settings.greenWaveLength = val;
}));

bodyEditor.atmosphereSliders.push(new Slider("blueWaveLength", document.getElementById("blueWaveLength")!, 0, 1000, atmosphere.settings.blueWaveLength, (val: number) => {
    atmosphere.settings.blueWaveLength = val;
}));

bodyEditor.atmosphereSliders.push(new Slider("mieHaloRadius", document.getElementById("mieHaloRadius")!, 0, 200, atmosphere.settings.mieHaloRadius * 100, (val: number) => {
    atmosphere.settings.mieHaloRadius = val / 100;
}));

//#endregion atmosphere

//#endregion

document.addEventListener("keyup", e => {
    if (e.key == "p") { // take screenshots
        Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, {precision: 4});
    }
    if (e.key == "w") {
        planet.surfaceMaterial.wireframe = !planet.surfaceMaterial.wireframe;
    }
});

let currentUI: HTMLElement | null = document.getElementById("generalUI");
for (const link of document.querySelector("nav")!.children) {
    link.addEventListener("click", e => {
        let id = link.id.substring(0, link.id.length - 4) + "UI";
        if (currentUI != null) {
            currentUI.hidden = true;
            if (currentUI.id == id) {
                currentUI = null;
                resizeUI();
                return;
            }
        }
        currentUI = document.getElementById(id)!;
        currentUI.hidden = false;
        resizeUI();
        bodyEditor.updateAllSliders();
    });
}

document.getElementById("defaultMapButton")!.addEventListener("click", () => {
    planet.colorSettings.mode = ColorMode.DEFAULT;
    planet.updateColors();
});
document.getElementById("moistureMapButton")!.addEventListener("click", () => {
    planet.colorSettings.mode = ColorMode.MOISTURE;
    planet.updateColors();
});
document.getElementById("temperatureMapButton")!.addEventListener("click", () => {
    planet.colorSettings.mode = ColorMode.TEMPERATURE;
    planet.updateColors();
});
document.getElementById("normalMapButton")!.addEventListener("click", () => {
    planet.colorSettings.mode = ColorMode.NORMAL;
    planet.updateColors();
});
document.getElementById("heightMapButton")!.addEventListener("click", () => {
    planet.colorSettings.mode = ColorMode.HEIGHT;
    planet.updateColors();
});

function resizeUI() {
    if (bodyEditor.getVisibility() != EditorVisibility.FULL) canvas.width = window.innerWidth;
    else canvas.width = window.innerWidth - 300; // on compte le panneau
    canvas.height = window.innerHeight;
    engine.resize();
}

window.addEventListener("resize", () => resizeUI());

resizeUI();

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        let deltaTime = engine.getDeltaTime() / 1000;

        player.nearestBody = starSystemManager.getNearestBody();

        let deplacement = player.listenToKeyboard(keyboard, deltaTime);
        starSystemManager.translateAllCelestialBody(deplacement);

        starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer, deltaTime * Settings.TIME_MULTIPLIER);

        scene.render();
    });
});