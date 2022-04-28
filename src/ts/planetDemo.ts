import {
    Engine,
    Scene,
    Color3,
    Texture,
    DepthRenderer,
    Axis,
    Vector3,
    Tools,
    FxaaPostProcess,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";

import {
    AtmosphericScatteringPostProcess
} from "./postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import {ColorMode, SolidPlanet} from "./celestialBodies/planets/solid/solidPlanet";
import {OceanPostProcess} from "./postProcesses/planetPostProcesses/oceanPostProcess";

import {Slider} from "handle-sliderjs";

import * as sliderStyle from "handle-sliderjs/dist/css/style2.css";
import * as style from "../styles/style.scss";

import {StarSystemManager} from "./celestialBodies/starSystemManager";
import {PlayerController} from "./player/playerController";
import {FlatCloudsPostProcess} from "./postProcesses/planetPostProcesses/flatCloudsPostProcess";
import {RingsPostProcess} from "./postProcesses/planetPostProcesses/ringsPostProcess";
import {Keyboard} from "./inputs/keyboard";
import {StarfieldPostProcess} from "./postProcesses/starfieldPostProcess";
import {Star} from "./celestialBodies/stars/star";

style.default;
sliderStyle.default;

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight;

let engine = new Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new Scene(engine);

let depthRenderer = new DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];

let timeMultiplicator = 1;
const planetRadius = 1000e3;

let player = new PlayerController(scene);
player.setSpeed(0.2 * planetRadius);
player.camera.maxZ = planetRadius * 20;

let keyboard = new Keyboard();

let starSystemManager = new StarSystemManager();

let sun = new Star("Weierstrass", 0.4 * planetRadius, new Vector3(-1, 0.5, -1).scale(planetRadius * 5), scene);
starSystemManager.addStar(sun);

let starfield = new StarfieldPostProcess("starfield", sun, scene);

let planet = new SolidPlanet("Hécate", planetRadius, new Vector3(0, 0, planetRadius * 3), 2, scene);
planet.rotate(Axis.X, 0.2);

planet.physicalProperties.rotationPeriod /= 500;

planet.colorSettings.plainColor = new Vector3(0.1, 0.4, 0).scale(0.7).add(new Vector3(0.5, 0.3, 0.08).scale(0.3));
planet.colorSettings.beachSize = 300;
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

let sliders: Slider[] = [];

sliders.push(new Slider("zoom", document.getElementById("zoom")!, 0, 100, 100 * planet._radius / planet.attachNode.position.z, (value: number) => {
    planet.attachNode.position.z = 100 * planet._radius / (value);
}));


sliders.push(new Slider("minTemperature", document.getElementById("minTemperature")!, -273, 300, planet.physicalProperties.minTemperature, (val: number) => {
    planet.physicalProperties.minTemperature = val;
}));

sliders.push(new Slider("maxTemperature", document.getElementById("maxTemperature")!, -273, 300, planet.physicalProperties.maxTemperature, (val: number) => {
    planet.physicalProperties.maxTemperature = val;
}));


document.getElementById("oceanToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[0] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    ocean.settings.oceanRadius = checkbox.checked ? planet.getRadius() : 0;
});

sliders.push(new Slider("alphaModifier", document.getElementById("alphaModifier")!, 0, 200, ocean.settings.alphaModifier * 10000, (val: number) => {
    ocean.settings.alphaModifier = val / 10000;
}));

sliders.push(new Slider("depthModifier", document.getElementById("depthModifier")!, 0, 70, ocean.settings.depthModifier * 10000, (val: number) => {
    ocean.settings.depthModifier = val / 10000;
}));

sliders.push(new Slider("specularPower", document.getElementById("specularPower")!, 0, 100, ocean.settings.specularPower * 10, (val: number) => {
    ocean.settings.specularPower = val / 10;
}));

sliders.push(new Slider("smoothness", document.getElementById("smoothness")!, 0, 100, ocean.settings.smoothness * 100, (val: number) => {
    ocean.settings.smoothness = val / 100;
}));

sliders.push(new Slider("waveBlendingSharpness", document.getElementById("waveBlendingSharpness")!, 0, 100, ocean.settings.smoothness * 100, (val: number) => {
    ocean.settings.waveBlendingSharpness = val / 100;
}));

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
sandColorPicker.value = babylonToHex(planet.colorSettings.beachColor);
sandColorPicker.addEventListener("input", () => {
    let color = Color3.FromHexString(sandColorPicker.value);
    planet.colorSettings.beachColor = new Vector3(color.r, color.g, color.b);
    planet.updateColors();
});

let desertColorPicker = document.getElementById("desertColor") as HTMLInputElement;
desertColorPicker.value = babylonToHex(planet.colorSettings.desertColor);
desertColorPicker.addEventListener("input", () => {
    let color = Color3.FromHexString(desertColorPicker.value);
    planet.colorSettings.desertColor = new Vector3(color.r, color.g, color.b);
    planet.updateColors();
});


sliders.push(new Slider("sandSize", document.getElementById("sandSize")!, 0, 300, planet.colorSettings.beachSize / 10, (val: number) => {
    planet.colorSettings.beachSize = val * 10;
    planet.updateColors();
}));

sliders.push(new Slider("steepSharpness", document.getElementById("steepSharpness")!, 0, 100, planet.colorSettings.steepSharpness * 10, (val: number) => {
    planet.colorSettings.steepSharpness = val / 10;
    planet.updateColors();
}));

sliders.push(new Slider("normalSharpness", document.getElementById("normalSharpness")!, 0, 100, planet.colorSettings.normalSharpness * 100, (val: number) => {
    planet.colorSettings.normalSharpness = val / 100;
    planet.updateColors();
}));

document.getElementById("cloudsToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[1] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    flatClouds.settings.cloudLayerRadius = checkbox.checked ? planetRadius + 15e3 : 0;
});

let cloudColorPicker = document.getElementById("cloudColor") as HTMLInputElement;
cloudColorPicker.value = babylonToHex(flatClouds.settings.cloudColor);
cloudColorPicker.addEventListener("input", () => {
    let color = Color3.FromHexString(cloudColorPicker.value);
    flatClouds.settings.cloudColor = new Vector3(color.r, color.g, color.b);
});


sliders.push(new Slider("cloudFrequency", document.getElementById("cloudFrequency")!, 0, 20, flatClouds.settings.cloudFrequency, (val: number) => {
    flatClouds.settings.cloudFrequency = val;
}));

sliders.push(new Slider("cloudDetailFrequency", document.getElementById("cloudDetailFrequency")!, 0, 50, flatClouds.settings.cloudDetailFrequency, (val: number) => {
    flatClouds.settings.cloudDetailFrequency = val;
}));

sliders.push(new Slider("cloudPower", document.getElementById("cloudPower")!, 0, 100, flatClouds.settings.cloudPower * 10, (val: number) => {
    flatClouds.settings.cloudPower = val / 10;
}));

sliders.push(new Slider("cloudSharpness", document.getElementById("cloudSharpness")!, 0, 100, flatClouds.settings.cloudSharpness, (val: number) => {
    flatClouds.settings.cloudSharpness = val;
}));

sliders.push(new Slider("worleySpeed", document.getElementById("worleySpeed")!, 0.0, 200.0, flatClouds.settings.worleySpeed * 10, (val: number) => {
    flatClouds.settings.worleySpeed = val / 10;
}));

sliders.push(new Slider("detailSpeed", document.getElementById("detailSpeed")!, 0, 200, flatClouds.settings.detailSpeed * 10, (val: number) => {
    flatClouds.settings.detailSpeed = val / 10;
}));

document.getElementById("atmosphereToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    atmosphere.settings.atmosphereRadius = checkbox.checked ? planetRadius + 100e3 : 0;
});

sliders.push(new Slider("intensity", document.getElementById("intensity")!, 0, 40, atmosphere.settings.intensity, (val: number) => {
    atmosphere.settings.intensity = val;
}));

sliders.push(new Slider("density", document.getElementById("density")!, 0, 40, atmosphere.settings.densityModifier * 10, (val: number) => {
    atmosphere.settings.densityModifier = val / 10;
}));

sliders.push(new Slider("atmosphereRadius", document.getElementById("atmosphereRadius")!, 0, 100, (atmosphere.settings.atmosphereRadius - planetRadius) / 10000, (val: number) => {
    atmosphere.settings.atmosphereRadius = planetRadius + val * 10000;
}));

sliders.push(new Slider("rayleighStrength", document.getElementById("rayleighStrength")!, 0, 40, atmosphere.settings.rayleighStrength * 10, (val: number) => {
    atmosphere.settings.rayleighStrength = val / 10;
}));

sliders.push(new Slider("mieStrength", document.getElementById("mieStrength")!, 0, 40, atmosphere.settings.mieStrength * 10, (val: number) => {
    atmosphere.settings.mieStrength = val / 10;
}));

sliders.push(new Slider("falloff", document.getElementById("falloff")!, -10, 200, atmosphere.settings.falloffFactor, (val: number) => {
    atmosphere.settings.falloffFactor = val;
}));

sliders.push(new Slider("redWaveLength", document.getElementById("redWaveLength")!, 0, 1000, atmosphere.settings.redWaveLength, (val: number) => {
    atmosphere.settings.redWaveLength = val;
}));

sliders.push(new Slider("greenWaveLength", document.getElementById("greenWaveLength")!, 0, 1000, atmosphere.settings.greenWaveLength, (val: number) => {
    atmosphere.settings.greenWaveLength = val;
}));

sliders.push(new Slider("blueWaveLength", document.getElementById("blueWaveLength")!, 0, 1000, atmosphere.settings.blueWaveLength, (val: number) => {
    atmosphere.settings.blueWaveLength = val;
}));

sliders.push(new Slider("mieHaloRadius", document.getElementById("mieHaloRadius")!, 0, 200, atmosphere.settings.mieHaloRadius * 100, (val: number) => {
    atmosphere.settings.mieHaloRadius = val / 100;
}));

document.getElementById("ringsToggler")?.addEventListener("click", () => {
    let checkbox = document.querySelectorAll("input[type='checkbox']")[3] as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    rings.settings.ringFrequency = checkbox.checked ? 30 : 0;
});

sliders.push(new Slider("ringsMinRadius", document.getElementById("ringsMinRadius")!, 100, 200, rings.settings.ringStart * 100, (val: number) => {
    rings.settings.ringStart = val / 100;
}));

sliders.push(new Slider("ringsMaxRadius", document.getElementById("ringsMaxRadius")!, 150, 400, rings.settings.ringEnd * 100, (val: number) => {
    rings.settings.ringEnd = val / 100;
}));

sliders.push(new Slider("ringsFrequency", document.getElementById("ringsFrequency")!, 10, 100, rings.settings.ringFrequency, (val: number) => {
    rings.settings.ringFrequency = val;
}));

sliders.push(new Slider("ringsOpacity", document.getElementById("ringsOpacity")!, 0, 100, rings.settings.ringOpacity * 100, (val: number) => {
    rings.settings.ringOpacity = val / 100;
}));

let sunOrientation = 220;
sliders.push(new Slider("sunOrientation", document.getElementById("sunOrientation")!, 1, 360, sunOrientation, (val: number) => {
    sun.mesh.rotateAround(planet.getAbsolutePosition(), new Vector3(0, 1, 0), -2 * Math.PI * (val - sunOrientation) / 360);
    sunOrientation = val;
}));

sliders.push(new Slider("timeModifier", document.getElementById("timeModifier")!, 0, 200, timeMultiplicator, (val: number) => {
    timeMultiplicator = val;
}));

sliders.push(new Slider("cameraFOV", document.getElementById("cameraFOV")!, 0, 360, player.camera.fov * 360 / Math.PI, (val: number) => {
    player.camera.fov = val * Math.PI / 360;
}));

//#endregion

document.addEventListener("keyup", e => {
    if (e.key == "p") { // take screenshots
        Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, {precision: 4});
    }
    if (e.key == "w") {
        planet.surfaceMaterial.wireframe = !planet.surfaceMaterial.wireframe;
    }
});

let currentUI: HTMLElement | null = null;
for (const link of document.querySelector("nav")!.children) {
    link.addEventListener("click", e => {
        let id = link.id.substring(0, link.id.length - 4) + "UI";
        if (currentUI != null) currentUI.hidden = true;
        currentUI = document.getElementById(id)!;
        currentUI.hidden = false;
        for (const slider of sliders) {
            slider.update(false);
        }
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

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth - 300; // on compte le panneau
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {

        let deltaTime = engine.getDeltaTime() / 1000;

        player.nearestBody = starSystemManager.getNearestBody();

        let deplacement = player.listenToKeyboard(keyboard, deltaTime);
        starSystemManager.translateAllCelestialBody(deplacement);

        starSystemManager.update(player, sun.getAbsolutePosition(), depthRenderer, deltaTime * timeMultiplicator);

        ocean.update(deltaTime * timeMultiplicator);
        flatClouds.update(deltaTime * timeMultiplicator);

        scene.render();
    });
});

