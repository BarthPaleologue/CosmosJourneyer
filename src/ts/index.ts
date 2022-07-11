import { Color3, Quaternion, Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";
import { Star } from "./bodies/stars/star";

import { PlayerController } from "./player/playerController";

import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";

import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./bodies/starSystemManager";

import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";

import lensFlare from "../asset/lensflare.png";

import "../styles/index.scss";

import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { GazPlanet } from "./bodies/planets/gazPlanet";

const bodyEditor = new BodyEditor();

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

bodyEditor.setCanvas(canvas);

const [engine, scene] = initEngineScene(canvas);

const mouse = new Mouse(canvas, 1e5);

const player = new PlayerController(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.camera.maxZ = Settings.EARTH_RADIUS * 100000;
player.inputs.push(new Keyboard(), mouse, new Gamepad());

Assets.Init(scene);

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const starSystem = new StarSystemManager(scene, Settings.VERTEX_RESOLUTION);

const starfield = new StarfieldPostProcess("starfield", starSystem);

const sun = new Star("Weierstrass", starSystem, 22, []);
sun.orbitalProperties.period = 60 * 60 * 24;
starfield.setStar(sun);

/*const lensFlareSystem = new LensFlareSystem("lensFlareSystem", sun.transform, scene);
const flare00 = new LensFlare(
    1.5, // size
    0, // position
    new Color3(1, 1, 1), // color
    lensFlare, // texture
    lensFlareSystem // lens flare system
);*/

const planet = new TelluricPlanet("Hécate", starSystem, -2.994, starSystem.stars);

planet.physicalProperties.rotationPeriod /= 20;

planet.orbitalProperties = {
    period: 60 * 60 * 24 * 365.25,
    apoapsis: 4000 * planet.getRadius(),
    periapsis: 4000 * planet.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};

const moon = new TelluricPlanet("Manaleth", starSystem, 2, [planet]);

moon.physicalProperties.mass = 2;
moon.physicalProperties.rotationPeriod = 7 * 60 * 60;
moon.physicalProperties.minTemperature = -180;
moon.physicalProperties.maxTemperature = 200;
moon.physicalProperties.waterAmount = 0.5;

moon.orbitalProperties = {
    period: moon.physicalProperties.rotationPeriod,
    apoapsis: 6 * planet.getRadius(),
    periapsis: 5 * planet.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};

moon.terrainSettings.mountainsFrequency /= 4;
moon.terrainSettings.continentsFragmentation = 1;
moon.terrainSettings.maxMountainHeight = 5e3;
moon.material.colorSettings.plainColor.copyFromFloats(0.67, 0.67, 0.67);
moon.material.colorSettings.desertColor.copyFrom(new Color3(116, 134, 121).scale(1 / 255));

moon.material.setTexture("plainNormalMap", Assets.DirtNormalMap);
moon.material.setTexture("bottomNormalMap", Assets.DirtNormalMap);
moon.material.updateManual();

const ares = new TelluricPlanet("Ares", starSystem, 432, starSystem.stars);

ares.postProcesses.ocean?.dispose();
starSystem.spaceRenderingPipeline.oceans.splice(starSystem.spaceRenderingPipeline.oceans.indexOf(ares.postProcesses.ocean!), 1);
starSystem.surfaceRenderingPipeline.oceans.splice(starSystem.surfaceRenderingPipeline.oceans.indexOf(ares.postProcesses.ocean!), 1);

ares.postProcesses.clouds?.dispose();
starSystem.spaceRenderingPipeline.clouds.splice(starSystem.spaceRenderingPipeline.clouds.indexOf(ares.postProcesses.clouds!), 1);
starSystem.surfaceRenderingPipeline.clouds.splice(starSystem.surfaceRenderingPipeline.clouds.indexOf(ares.postProcesses.clouds!), 1);

ares.physicalProperties.mass = 7;
ares.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
ares.physicalProperties.minTemperature = -80;
ares.physicalProperties.maxTemperature = 20;
ares.physicalProperties.pressure = 0.5;
ares.physicalProperties.waterAmount = 0.3;

ares.orbitalProperties = {
    period: 60 * 60 * 24 * 365.24,
    periapsis: 4020 * planet.getRadius(),
    apoapsis: 4020 * planet.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};

ares.terrainSettings.continentsFragmentation = 0.5;
ares.terrainSettings.continentBaseHeight = 5e3;
ares.terrainSettings.maxMountainHeight = 20e3;
ares.terrainSettings.mountainsMinValue = 0.4;

ares.material.colorSettings.plainColor.copyFromFloats(0.4, 0.3, 0.3);
ares.material.colorSettings.beachColor.copyFromFloats(0.3, 0.15, 0.1);
ares.material.colorSettings.bottomColor.copyFromFloats(0.05, 0.1, 0.15);

ares.oceanLevel = Settings.OCEAN_DEPTH * ares.physicalProperties.waterAmount * ares.physicalProperties.pressure;

ares.material.updateManual();

const aresAtmosphere = ares.postProcesses.atmosphere!;
aresAtmosphere.settings.redWaveLength = 500;
aresAtmosphere.settings.greenWaveLength = 680;
aresAtmosphere.settings.blueWaveLength = 670;

const andromaque = new GazPlanet("Andromaque", starSystem, 0.68, [sun]);
andromaque.orbitalProperties = {
    period: 60 * 60 * 24 * 365.29,
    periapsis: 4300 * ares.getRadius(),
    apoapsis: 4300 * ares.getRadius(),
    orientationQuaternion: Quaternion.Identity()
};

starSystem.init();

const collisionWorker = new CollisionWorker(player, starSystem);

// update to current date
starSystem.update(player, Date.now() / 1000);

player.positionNearBody(planet);

function updateScene() {
    const deltaTime = engine.getDeltaTime() / 1000;

    player.nearestBody = starSystem.getMostInfluentialBodyAtPoint(player.getAbsolutePosition());

    bodyEditor.update(player);

    document.getElementById("planetName")!.innerText = player.isOrbiting() ? player.nearestBody.name : "Outer Space";

    starSystem.translateAllBodies(player.update(deltaTime));

    //FIXME: should address stars orbits
    for (const star of starSystem.stars) {
        star.orbitalProperties.period = 0;
    }
    starSystem.update(player, deltaTime * Settings.TIME_MULTIPLIER);

    if (!collisionWorker.isBusy() && player.isOrbiting()) {
        if (player.nearestBody?.bodyType == BodyType.TELLURIC) {
            collisionWorker.checkCollision(player.nearestBody as TelluricPlanet);
        }
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
    if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
    if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
    if (e.key == "w" && player.isOrbiting())
        (<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe = !(<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe;
});

window.addEventListener("resize", () => {
    bodyEditor.resize();
    engine.resize();
});

bodyEditor.resize();

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});
