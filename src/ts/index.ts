import "../styles/index.scss";

import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";

import { StarSystem } from "./bodies/starSystem";

import { Settings } from "./settings";
import { Assets } from "./assets";
import { PlayerController } from "./spacelegs/playerController";
import { positionNearBody } from "./utils/positionNearBody";
import { PlanetEngine } from "./planetEngine";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ShipController } from "./spaceship/shipController";

const engine = new PlanetEngine();

await engine.setup();

const scene = engine.getScene();

const mouse = new Mouse(engine.canvas, 1e5);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const player = new PlayerController(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
player.addInput(keyboard);
player.addInput(mouse);
player.addInput(gamepad);

const spaceshipController = new ShipController(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(gamepad);

scene.setActiveController(spaceshipController);

engine.registerUpdateCallback(() => {
    if (scene.getActiveController() != spaceshipController) return;

    const shipPosition = spaceshipController.transform.getAbsolutePosition();
    const nearestBody = engine.getStarSystem().getNearestBody(shipPosition);
    const distance = nearestBody.transform.getAbsolutePosition().subtract(shipPosition).length();
    const radius = nearestBody.getRadius();
    spaceshipController.registerClosestDistanceToPlanet(distance - radius);
});

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const starSystemSeed = 0;
const starSystem = new StarSystem(starSystemSeed, scene);
engine.setStarSystem(starSystem);

const sun = starSystem.makeStellarObject(0.51);
sun.descriptor.orbitalProperties.period = 60 * 60 * 24;

const planet = starSystem.makeTelluricPlanet(0.4233609183800225);

planet.descriptor.physicalProperties.minTemperature = -37;
planet.descriptor.physicalProperties.maxTemperature = 40;
planet.material.updateConstants();

planet.descriptor.orbitalProperties.period = 60 * 60 * 24 * 365.25;
planet.descriptor.orbitalProperties.apoapsis = 4000 * planet.getRadius();
planet.descriptor.orbitalProperties.periapsis = 4000 * planet.getRadius();
planet.descriptor.orbitalProperties.orientationQuaternion = Quaternion.Identity();

const moon = starSystem.makeSatellite(planet, 10);

moon.descriptor.physicalProperties.mass = 2;
moon.descriptor.physicalProperties.rotationPeriod = 7 * 60 * 60;
moon.descriptor.physicalProperties.minTemperature = -180;
moon.descriptor.physicalProperties.maxTemperature = 200;
moon.descriptor.physicalProperties.waterAmount = 0.9;

moon.descriptor.orbitalProperties.period = moon.descriptor.physicalProperties.rotationPeriod;
moon.descriptor.orbitalProperties.apoapsis = 8 * planet.getRadius();
moon.descriptor.orbitalProperties.periapsis = 8 * planet.getRadius();
moon.descriptor.orbitalProperties.orientationQuaternion = Quaternion.Identity();

moon.material.colorSettings.plainColor.copyFromFloats(0.67, 0.67, 0.67);
moon.material.colorSettings.desertColor.copyFrom(new Color3(116, 134, 121).scale(1 / 255));
moon.material.colorSettings.steepColor.copyFrom(new Color3(92, 92, 92).scale(1 / 255));

moon.material.setTexture("plainNormalMap", Assets.DirtNormalMap);
moon.material.setTexture("bottomNormalMap", Assets.DirtNormalMap);
moon.material.updateConstants();

const ares = starSystem.makeTelluricPlanet(0.3725);
ares.postProcesses.ocean = false;
ares.postProcesses.clouds = false;

ares.descriptor.physicalProperties.mass = 7;
ares.descriptor.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
ares.descriptor.physicalProperties.minTemperature = -48;
ares.descriptor.physicalProperties.maxTemperature = 20;
ares.descriptor.physicalProperties.pressure = 0.5;
ares.descriptor.physicalProperties.waterAmount = 0.2;
ares.descriptor.physicalProperties.oceanLevel = Settings.OCEAN_DEPTH * ares.descriptor.physicalProperties.waterAmount * ares.descriptor.physicalProperties.pressure;

ares.descriptor.orbitalProperties.period = 60 * 60 * 24 * 365.24;
ares.descriptor.orbitalProperties.periapsis = 4020 * planet.getRadius();
ares.descriptor.orbitalProperties.apoapsis = 4020 * planet.getRadius();
ares.descriptor.orbitalProperties.orientationQuaternion = Quaternion.Identity();

ares.descriptor.terrainSettings.continents_fragmentation = 0.0;
ares.descriptor.terrainSettings.continent_base_height = 10e3;
ares.descriptor.terrainSettings.max_mountain_height = 20e3;

ares.material.colorSettings.plainColor.copyFromFloats(0.4, 0.3, 0.3);
ares.material.colorSettings.desertColor.copyFromFloats(178 / 255, 107 / 255, 42 / 255);
ares.material.colorSettings.steepColor.copyFrom(ares.material.colorSettings.desertColor.scale(0.9));
ares.material.colorSettings.beachColor.copyFromFloats(0.3, 0.15, 0.1);
ares.material.colorSettings.bottomColor.copyFromFloats(0.05, 0.1, 0.15);

ares.material.updateConstants();

const andromaque = starSystem.makeGasPlanet(0.28711440474126226);
andromaque.descriptor.orbitalProperties.period = 60 * 60 * 24 * 365.25;
andromaque.descriptor.orbitalProperties.periapsis = 4300 * ares.getRadius();
andromaque.descriptor.orbitalProperties.apoapsis = 4300 * ares.getRadius();
andromaque.descriptor.orbitalProperties.orientationQuaternion = Quaternion.Identity();

engine.init();

positionNearBody(scene.getActiveController(), planet, starSystem);

const aresAtmosphere = starSystem.postProcessManager.getAtmosphere(ares);
aresAtmosphere.settings.redWaveLength = 500;
aresAtmosphere.settings.greenWaveLength = 680;
aresAtmosphere.settings.blueWaveLength = 670;

document.addEventListener("keydown", (e) => {
    if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
    if (e.key == "g") {
        if (scene.getActiveController() == spaceshipController) {
            scene.setActiveController(player);
            player.transform.setRotationQuaternion(spaceshipController.transform.getRotationQuaternion().clone());
            engine.getStarSystem().postProcessManager.rebuild(spaceshipController.getActiveCamera());
            spaceshipController.setHidden(true);
        } else {
            scene.setActiveController(spaceshipController);
            spaceshipController.transform.setRotationQuaternion(player.transform.getRotationQuaternion().clone());
            engine.getStarSystem().postProcessManager.rebuild(player.getActiveCamera());
            spaceshipController.setHidden(false);
        }
    }
});
