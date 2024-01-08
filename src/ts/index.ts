import "../styles/index.scss";

import { StarSystemController } from "./starSystem/starSystemController";

import { Settings } from "./settings";
import { Assets } from "./assets";
import { DefaultControls } from "./defaultController/defaultControls";
import { positionNearObject } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ShipControls } from "./spaceship/shipControls";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { TelluricPlanemoModel } from "./planemos/telluricPlanemo/telluricPlanemoModel";
import { GasPlanetModel } from "./planemos/gasPlanet/gasPlanetModel";
import {
    getForwardDirection,
    getRotationQuaternion,
    setRotationQuaternion,
    translate
} from "./uberCore/transforms/basicTransform";
import { parsePercentageFrom01, parseSpeed } from "./utils/parseToStrings";

import { StarSystemHelper } from "./starSystem/starSystemHelper";
import { Mouse } from "./inputs/mouse";
import { Keyboard } from "./inputs/keyboard";
import { StarModel } from "./stellarObjects/star/starModel";
import { RingsUniforms } from "./postProcesses/rings/ringsUniform";
import { getMoonSeed } from "./planemos/common";

import { Gamepad } from "./inputs/gamepad";
import { CharacterControls } from "./spacelegs/characterControls";

const engine = new CosmosJourneyer();

await engine.setup();

const starSystemView = engine.getStarSystemView();

const mouse = new Mouse(engine.canvas, 100);
const keyboard = new Keyboard();
const gamepad = new Gamepad();

const maxZ = Settings.EARTH_RADIUS * 1e5;

const defaultController = new DefaultControls(starSystemView.scene);
defaultController.speed = 0.2 * Settings.EARTH_RADIUS;
defaultController.getActiveCamera().maxZ = maxZ;
defaultController.addInput(keyboard);
defaultController.addInput(gamepad);

const shipControls = new ShipControls(starSystemView.scene);
shipControls.getActiveCamera().maxZ = maxZ;
shipControls.addInput(keyboard);
shipControls.addInput(gamepad);
shipControls.addInput(mouse);

const characterController = new CharacterControls(starSystemView.scene);
characterController.getTransform().setEnabled(false);
characterController.getActiveCamera().maxZ = maxZ;
characterController.addInput(keyboard);
characterController.addInput(gamepad);

// const physicsViewer = new PhysicsViewer();
// physicsViewer.showBody(shipControls.aggregate.body);

mouse.onMouseLeaveObservable.add(() => {
    if (starSystemView.scene.getActiveController() === shipControls) engine.pause();
});

starSystemView.scene.setActiveController(shipControls);

engine.registerStarSystemUpdateCallback(() => {
    if (starSystemView.scene.getActiveController() != shipControls) return;

    const shipPosition = shipControls.getTransform().getAbsolutePosition();
    const nearestBody = starSystemView.getStarSystem().getNearestOrbitalObject();
    const distance = nearestBody.getTransform().getAbsolutePosition().subtract(shipPosition).length();
    const radius = nearestBody.getBoundingRadius();
    shipControls.spaceship.registerClosestObject(distance, radius);

    const warpDrive = shipControls.spaceship.getWarpDrive();
    const shipInternalThrottle = warpDrive.getInternalThrottle();
    const shipTargetThrottle = warpDrive.getTargetThrottle();

    const throttleString = warpDrive.isEnabled()
        ? `${parsePercentageFrom01(shipInternalThrottle)}/${parsePercentageFrom01(shipTargetThrottle)}`
        : `${parsePercentageFrom01(shipControls.spaceship.getThrottle())}/100%`;

    (document.querySelector("#speedometer") as HTMLElement).innerHTML = `${throttleString} | ${parseSpeed(shipControls.spaceship.getSpeed())}`;

    characterController.setClosestWalkableObject(nearestBody);
    shipControls.spaceship.setClosestWalkableObject(nearestBody);
});

engine.getStarMap().onWarpObservable.add(() => {
    shipControls.thirdPersonCamera.radius = 30;
});

engine.onToggleStarMapObservable.add((isStarMapOpen) => {
    if (!isStarMapOpen) shipControls.thirdPersonCamera.radius = 30;
});

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const starSystemSeed = 0;
const starSystem = new StarSystemController(starSystemSeed, starSystemView.scene);
starSystem.model.setName("Alpha Testis");

engine.getStarSystemView().setStarSystem(starSystem, false);

const sunModel = new StarModel(0.51);
const sun = StarSystemHelper.makeStar(starSystem, sunModel);
sun.model.orbit.period = 60 * 60 * 24;

/*const secundaModel = new StarModel(-672446, sunModel);
secundaModel.orbit.radius = 30 * sunModel.radius;
secundaModel.orbit.period = 60 * 60;
const secunda = StarSystemHelper.makeStar(starSystem, secundaModel);

const terminaModel = new StarModel(756263, sunModel);
terminaModel.orbit.radius = 50 * sunModel.radius;
terminaModel.orbit.period = 60 * 60;
const termina = StarSystemHelper.makeStar(starSystem, terminaModel);*/

const planetModel = new TelluricPlanemoModel(0.4233609183800225, sunModel);
planetModel.physicalProperties.minTemperature = -37;
planetModel.physicalProperties.maxTemperature = 30;

planetModel.orbit.period = 60 * 60 * 24 * 365.25;
planetModel.orbit.radius = 4000 * planetModel.radius;
planetModel.orbit.normalToPlane = Vector3.Up();

const planet = StarSystemHelper.makeTelluricPlanet(starSystem, planetModel);
planet.model.ringsUniforms = new RingsUniforms(planet.model.rng);
planet.postProcesses.push(PostProcessType.RING);

//const spacestation = new SpaceStation(starSystemView.scene, planet);
//starSystemView.getStarSystem().addSpaceStation(spacestation);

const moonModel = new TelluricPlanemoModel(getMoonSeed(planetModel, 0), planetModel);
moonModel.physicalProperties.mass = 2;
moonModel.physicalProperties.rotationPeriod = 7 * 60 * 60;
moonModel.physicalProperties.minTemperature = -180;
moonModel.physicalProperties.maxTemperature = 200;
moonModel.physicalProperties.waterAmount = 0.9;

moonModel.orbit.period = moonModel.physicalProperties.rotationPeriod;
moonModel.orbit.radius = 8 * planet.getRadius();
moonModel.orbit.normalToPlane = Vector3.Up();

const moon = StarSystemHelper.makeSatellite(starSystem, planet, moonModel);

moon.material.colorSettings.plainColor.copyFromFloats(0.67, 0.67, 0.67);
moon.material.colorSettings.desertColor.copyFrom(new Color3(116, 134, 121).scale(1 / 255));
moon.material.colorSettings.steepColor.copyFrom(new Color3(92, 92, 92).scale(1 / 255));

moon.material.setTexture("plainNormalMap", Assets.DirtNormalMap);
moon.material.setTexture("bottomNormalMap", Assets.DirtNormalMap);
moon.material.updateConstants();

const aresModel = new TelluricPlanemoModel(0.3725, sunModel);
aresModel.physicalProperties.mass = 7;
aresModel.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
aresModel.physicalProperties.minTemperature = -30;
aresModel.physicalProperties.maxTemperature = 20;
aresModel.physicalProperties.pressure = 0.5;
aresModel.physicalProperties.waterAmount = 0.2;
aresModel.physicalProperties.oceanLevel = Settings.OCEAN_DEPTH * aresModel.physicalProperties.waterAmount * aresModel.physicalProperties.pressure;

aresModel.orbit.period = 60 * 60 * 24 * 365.24;
aresModel.orbit.radius = 4020 * planet.getRadius();
aresModel.orbit.normalToPlane = Vector3.Up();

//aresModel.terrainSettings.continents_fragmentation = 0.0;
//aresModel.terrainSettings.continent_base_height = 10e3;
//aresModel.terrainSettings.max_mountain_height = 20e3;

const ares = StarSystemHelper.makeTelluricPlanet(starSystem, aresModel);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.OCEAN), 1);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.CLOUDS), 1);

ares.material.colorSettings.plainColor.copyFromFloats(143 / 255, 45 / 255, 45 / 255);
ares.material.colorSettings.desertColor.copyFromFloats(178 / 255, 107 / 255, 42 / 255);
ares.material.colorSettings.beachColor.copyFrom(ares.material.colorSettings.plainColor);
ares.material.colorSettings.bottomColor.copyFrom(ares.material.colorSettings.plainColor.scale(0.9));

ares.material.updateConstants();

const andromaqueModel = new GasPlanetModel(0.28711440474126226, sunModel);
andromaqueModel.orbit.period = 60 * 60 * 24 * 365.25;
andromaqueModel.orbit.radius = 4300 * ares.getRadius();
andromaqueModel.orbit.normalToPlane = Vector3.Up();

const andromaque = StarSystemHelper.makeGasPlanet(starSystem, andromaqueModel);

/*const blackHoleModel = new BlackHoleModel(0.5, sunModel);
blackHoleModel.orbit.period = 60 * 60 * 24 * 365.25;
blackHoleModel.orbit.radius = 100 * ares.getRadius();
const blackHole = starSystem.makeBlackHole(blackHoleModel);*/

engine.init();

positionNearObject(starSystemView.scene.getActiveController(), planet, starSystem, 2);

shipControls.spaceship.toggleWarpDrive();

const aresAtmosphere = starSystem.postProcessManager.getAtmosphere(ares);
if (aresAtmosphere) {
    aresAtmosphere.atmosphereUniforms.redWaveLength = 500;
    aresAtmosphere.atmosphereUniforms.greenWaveLength = 680;
    aresAtmosphere.atmosphereUniforms.blueWaveLength = 670;
} else {
    console.warn("No atmosphere found for Ares");
}

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;

    if(e.key === "y") {
        if(starSystemView.scene.getActiveController() === shipControls) {
            console.log("disembark");

            characterController.getTransform().setEnabled(true);
            characterController.getTransform().setAbsolutePosition(shipControls.getTransform().absolutePosition);
            translate(characterController.getTransform(), getForwardDirection(shipControls.getTransform()).scale(10));

            setRotationQuaternion(characterController.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());

            starSystemView.scene.setActiveController(characterController);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        } else if(starSystemView.scene.getActiveController() === characterController) {
            console.log("embark");

            characterController.getTransform().setEnabled(false);
            starSystemView.scene.setActiveController(shipControls);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        }
    }

    if (e.key === "g") {
        if (starSystemView.scene.getActiveController() === shipControls) {
            starSystemView.scene.setActiveController(defaultController);
            setRotationQuaternion(defaultController.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            shipControls.spaceship.setEnabled(false, engine.getHavokPlugin());
        } else if (starSystemView.scene.getActiveController() === defaultController) {
            characterController.getTransform().setEnabled(true);
            characterController.getTransform().setAbsolutePosition(defaultController.getTransform().absolutePosition);
            starSystemView.scene.setActiveController(characterController);
            setRotationQuaternion(characterController.getTransform(), getRotationQuaternion(defaultController.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            shipControls.spaceship.setEnabled(false, engine.getHavokPlugin());
        } else if (starSystemView.scene.getActiveController() === characterController) {
            characterController.getTransform().setEnabled(false);
            starSystemView.scene.setActiveController(shipControls);
            setRotationQuaternion(shipControls.getTransform(), getRotationQuaternion(defaultController.getTransform()).clone());
            starSystemView.getStarSystem().postProcessManager.rebuild();

            shipControls.spaceship.setEnabled(true, engine.getHavokPlugin());
        }
    }
});
