import "../styles/index.scss";

import { Keyboard } from "./controller/inputs/keyboard";
import { Mouse } from "./controller/inputs/mouse";
import { Gamepad } from "./controller/inputs/gamepad";

import { StarSystem } from "./controller/starSystem";

import { Settings } from "./settings";
import { Assets } from "./controller/assets";
import { PlayerController } from "./spacelegs/playerController";
import { positionNearObject } from "./utils/positionNearObject";
import { PlanetEngine } from "./controller/planetEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ShipController } from "./spaceship/shipController";
import { SpaceStation } from "./view/spacestation/spaceStation";
import { PostProcessType } from "./view/postProcesses/postProcessTypes";
import { TelluricPlanemoModel } from "./model/planemos/telluricPlanemoModel";
import { StarModel } from "./model/stellarObjects/starModel";
import { GasPlanetModel } from "./model/planemos/gasPlanetModel";
import { getRotationQuaternion, setRotationQuaternion } from "./controller/uberCore/transforms/basicTransform";
import { PhysicsViewer } from "@babylonjs/core/Debug/physicsViewer";

const engine = new PlanetEngine();

await engine.setup();

const scene = engine.getStarSystemScene();

const mouse = new Mouse(engine.canvas, 100);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const player = new PlayerController(scene);
player.speed = 0.2 * Settings.EARTH_RADIUS;
player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
player.addInput(keyboard);
player.addInput(mouse);
player.addInput(gamepad);
player.setEnabled(false, engine.getHavokPlugin());

const spaceshipController = new ShipController(scene);
spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
spaceshipController.addInput(keyboard);
spaceshipController.addInput(gamepad);
spaceshipController.addInput(mouse);

const physicsViewer = new PhysicsViewer();
physicsViewer.showBody(spaceshipController.aggregate.body);

mouse.addOnMouseEnterListener(() => {
    if (scene.getActiveController() === spaceshipController) engine.resume();
});
mouse.addOnMouseLeaveListener(() => {
    if (scene.getActiveController() === spaceshipController) engine.pause();
});

scene.setActiveController(spaceshipController);

engine.registerStarSystemUpdateCallback(() => {
    if (scene.getActiveController() != spaceshipController) return;

    const shipPosition = spaceshipController.aggregate.transformNode.getAbsolutePosition();
    const nearestBody = engine.getStarSystem().getNearestObject(shipPosition);
    const distance = nearestBody.transform.getAbsolutePosition().subtract(shipPosition).length();
    const radius = nearestBody.getBoundingRadius();
    spaceshipController.registerClosestObject(distance, radius);
});

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const starSystemSeed = 0;
const starSystem = new StarSystem(starSystemSeed, scene);
engine.setStarSystem(starSystem, false);

const sunModel = new StarModel(0.51, []);
const sun = starSystem.makeStar(sunModel);
sun.model.orbitalProperties.period = 60 * 60 * 24;

const planetModel = new TelluricPlanemoModel(0.4233609183800225, [sunModel]);
planetModel.physicalProperties.minTemperature = -37;
planetModel.physicalProperties.maxTemperature = 30;

planetModel.orbitalProperties.period = 60 * 60 * 24 * 365.25;
planetModel.orbitalProperties.apoapsis = 4000 * planetModel.radius;
planetModel.orbitalProperties.periapsis = 4000 * planetModel.radius;
planetModel.orbitalProperties.orientationQuaternion = Quaternion.Identity();

const planet = starSystem.makeTelluricPlanet(planetModel);

const spacestation = new SpaceStation([planet], scene);
engine.getStarSystem().addSpaceStation(spacestation);

const moonModel = new TelluricPlanemoModel(planetModel.getMoonSeed(0), [planetModel]);
moonModel.physicalProperties.mass = 2;
moonModel.physicalProperties.rotationPeriod = 7 * 60 * 60;
moonModel.physicalProperties.minTemperature = -180;
moonModel.physicalProperties.maxTemperature = 200;
moonModel.physicalProperties.waterAmount = 0.9;

moonModel.orbitalProperties.period = moonModel.physicalProperties.rotationPeriod;
moonModel.orbitalProperties.apoapsis = 8 * planet.getRadius();
moonModel.orbitalProperties.periapsis = 8 * planet.getRadius();
moonModel.orbitalProperties.orientationQuaternion = Quaternion.Identity();

const moon = starSystem.makeSatellite(planet, moonModel);

moon.material.colorSettings.plainColor.copyFromFloats(0.67, 0.67, 0.67);
moon.material.colorSettings.desertColor.copyFrom(new Color3(116, 134, 121).scale(1 / 255));
moon.material.colorSettings.steepColor.copyFrom(new Color3(92, 92, 92).scale(1 / 255));

moon.material.setTexture("plainNormalMap", Assets.DirtNormalMap);
moon.material.setTexture("bottomNormalMap", Assets.DirtNormalMap);
moon.material.updateConstants();

const aresModel = new TelluricPlanemoModel(0.3725, [sunModel]);
aresModel.physicalProperties.mass = 7;
aresModel.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
aresModel.physicalProperties.minTemperature = -48;
aresModel.physicalProperties.maxTemperature = 20;
aresModel.physicalProperties.pressure = 0.5;
aresModel.physicalProperties.waterAmount = 0.2;
aresModel.physicalProperties.oceanLevel = Settings.OCEAN_DEPTH * aresModel.physicalProperties.waterAmount * aresModel.physicalProperties.pressure;

aresModel.orbitalProperties.period = 60 * 60 * 24 * 365.24;
aresModel.orbitalProperties.periapsis = 4020 * planet.getRadius();
aresModel.orbitalProperties.apoapsis = 4020 * planet.getRadius();
aresModel.orbitalProperties.orientationQuaternion = Quaternion.Identity();

aresModel.terrainSettings.continents_fragmentation = 0.0;
aresModel.terrainSettings.continent_base_height = 10e3;
aresModel.terrainSettings.max_mountain_height = 20e3;

const ares = starSystem.makeTelluricPlanet(aresModel);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.OCEAN), 1);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.CLOUDS), 1);

ares.material.colorSettings.plainColor.copyFromFloats(0.4, 0.3, 0.3);
ares.material.colorSettings.desertColor.copyFromFloats(178 / 255, 107 / 255, 42 / 255);
ares.material.colorSettings.steepColor.copyFrom(ares.material.colorSettings.desertColor.scale(0.9));
ares.material.colorSettings.beachColor.copyFromFloats(0.3, 0.15, 0.1);
ares.material.colorSettings.bottomColor.copyFromFloats(0.05, 0.1, 0.15);

ares.material.updateConstants();

const andromaqueModel = new GasPlanetModel(0.28711440474126226, [sunModel]);
andromaqueModel.orbitalProperties.period = 60 * 60 * 24 * 365.25;
andromaqueModel.orbitalProperties.periapsis = 4300 * ares.getRadius();
andromaqueModel.orbitalProperties.apoapsis = 4300 * ares.getRadius();
andromaqueModel.orbitalProperties.orientationQuaternion = Quaternion.Identity();

const andromaque = starSystem.makeGasPlanet(andromaqueModel);

engine.init();

positionNearObject(scene.getActiveController(), planet, starSystem, 2);

const aresAtmosphere = starSystem.postProcessManager.getAtmosphere(ares);
if (aresAtmosphere) {
    aresAtmosphere.settings.redWaveLength = 500;
    aresAtmosphere.settings.greenWaveLength = 680;
    aresAtmosphere.settings.blueWaveLength = 670;
} else {
    console.warn("No atmosphere found for Ares");
}

document.addEventListener("keydown", (e) => {
    if (e.key === "g") {
        if (scene.getActiveController() === spaceshipController) {
            scene.setActiveController(player);
            setRotationQuaternion(player.aggregate.transformNode, getRotationQuaternion(spaceshipController.aggregate.transformNode).clone());
            engine.getStarSystem().postProcessManager.rebuild(spaceshipController.getActiveCamera());

            spaceshipController.setEnabled(false, engine.getHavokPlugin());
            player.setEnabled(true, engine.getHavokPlugin());
        } else {
            scene.setActiveController(spaceshipController);
            setRotationQuaternion(spaceshipController.aggregate.transformNode, getRotationQuaternion(player.aggregate.transformNode).clone());
            engine.getStarSystem().postProcessManager.rebuild(player.getActiveCamera());

            player.setEnabled(false, engine.getHavokPlugin());
            spaceshipController.setEnabled(true, engine.getHavokPlugin());
        }
    }
});

engine.toggleStarMap();
