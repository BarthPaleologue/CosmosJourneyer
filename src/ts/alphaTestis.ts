//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "../styles/index.scss";

import { StarSystemController } from "./starSystem/starSystemController";

import { Settings } from "./settings";
import { Assets } from "./assets";
import { positionNearObjectBrightSide } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { TelluricPlanetModel } from "./planets/telluricPlanet/telluricPlanetModel";
import { GasPlanetModel } from "./planets/gasPlanet/gasPlanetModel";
import { getForwardDirection, getRotationQuaternion, setRotationQuaternion, translate } from "./uberCore/transforms/basicTransform";
import { StarSystemHelper } from "./starSystem/starSystemHelper";
import { StarModel } from "./stellarObjects/star/starModel";
import { RingsUniforms } from "./postProcesses/rings/ringsUniform";
import { getMoonSeed } from "./planets/common";
import { SystemSeed } from "./utils/systemSeed";
import { SpaceStation } from "./spacestation/spaceStation";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

const spaceshipController = starSystemView.getSpaceshipControls();

const characterController = starSystemView.getCharacterControls();

// const physicsViewer = new PhysicsViewer();
// physicsViewer.showBody(spaceshipController.aggregate.body);

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const starSystemSeed = new SystemSeed(0, 0, 0, 0);
const starSystem = new StarSystemController(starSystemSeed, starSystemView.scene);
starSystem.model.setName("Alpha Testis");

starSystemView.setStarSystem(starSystem, false);

const sunModel = new StarModel(0.51);
const sun = StarSystemHelper.MakeStar(starSystem, sunModel);
sun.model.orbit.period = 60 * 60 * 24;

/*const secundaModel = new StarModel(-672446, sunModel);
secundaModel.orbit.radius = 30 * sunModel.radius;
secundaModel.orbit.period = 60 * 60;
const secunda = StarSystemHelper.makeStar(starSystem, secundaModel);

const terminaModel = new StarModel(756263, sunModel);
terminaModel.orbit.radius = 50 * sunModel.radius;
terminaModel.orbit.period = 60 * 60;
const termina = StarSystemHelper.makeStar(starSystem, terminaModel);*/

const planetModel = new TelluricPlanetModel(0.4233609183800225, sunModel);
planetModel.physicalProperties.minTemperature = -40;
planetModel.physicalProperties.maxTemperature = 30;

planetModel.orbit.period = 60 * 60 * 24 * 365.25;
planetModel.orbit.radius = 4000 * planetModel.radius;
planetModel.orbit.normalToPlane = Vector3.Up();

const planet = StarSystemHelper.MakeTelluricPlanet(starSystem, planetModel);
planet.model.ringsUniforms = new RingsUniforms(planet.model.rng);
planet.postProcesses.push(PostProcessType.RING);

const spacestation = new SpaceStation(starSystemView.scene, planet);
starSystemView.getStarSystem().addSpaceStation(spacestation);

//physicsViewer.showBody(spacestation.aggregate.body);
/*for(const landingpad of spacestation.landingPads) {
    physicsViewer.showBody(landingpad.aggregate.body);
}*/

const moonModel = new TelluricPlanetModel(getMoonSeed(planetModel, 0), planetModel);
moonModel.physicalProperties.mass = 2;
moonModel.physicalProperties.rotationPeriod = 7 * 60 * 60;
moonModel.physicalProperties.minTemperature = -180;
moonModel.physicalProperties.maxTemperature = 200;
moonModel.physicalProperties.waterAmount = 0.9;

moonModel.orbit.period = moonModel.physicalProperties.rotationPeriod;
moonModel.orbit.radius = 8 * planet.getRadius();
moonModel.orbit.normalToPlane = Vector3.Up();

const moon = StarSystemHelper.MakeSatellite(starSystem, planet, moonModel);

moon.material.colorSettings.plainColor.copyFromFloats(0.67, 0.67, 0.67);
moon.material.colorSettings.desertColor.copyFrom(new Color3(116, 134, 121).scale(1 / 255));
moon.material.colorSettings.steepColor.copyFrom(new Color3(92, 92, 92).scale(1 / 255));

moon.material.setTexture("plainNormalMap", Assets.DIRT_NORMAL_MAP);
moon.material.setTexture("bottomNormalMap", Assets.DIRT_NORMAL_MAP);
moon.material.updateConstants();

const aresModel = new TelluricPlanetModel(0.3725, sunModel);
aresModel.physicalProperties.mass = 7;
aresModel.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
aresModel.physicalProperties.minTemperature = -30;
aresModel.physicalProperties.maxTemperature = 20;
aresModel.physicalProperties.pressure = 0.5;
aresModel.physicalProperties.waterAmount = 0.2;
aresModel.physicalProperties.oceanLevel = 0;

aresModel.orbit.period = 60 * 60 * 24 * 365.24;
aresModel.orbit.radius = 4020 * planet.getRadius();
aresModel.orbit.normalToPlane = Vector3.Up();

//aresModel.terrainSettings.continents_fragmentation = 0.0;
//aresModel.terrainSettings.continent_base_height = 10e3;
//aresModel.terrainSettings.max_mountain_height = 20e3;

const ares = StarSystemHelper.MakeTelluricPlanet(starSystem, aresModel);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.OCEAN), 1);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.CLOUDS), 1);

ares.material.colorSettings.plainColor.copyFromFloats(139 / 255, 59 / 255, 24 / 255);
ares.material.colorSettings.desertColor.copyFromFloats(178 / 255, 107 / 255, 42 / 255);
ares.material.colorSettings.beachColor.copyFrom(ares.material.colorSettings.plainColor);
ares.material.colorSettings.bottomColor.copyFrom(ares.material.colorSettings.plainColor.scale(0.9));

ares.material.updateConstants();

const andromaqueModel = new GasPlanetModel(0.28711440474126226, sunModel);
andromaqueModel.orbit.period = 60 * 60 * 24 * 365.25;
andromaqueModel.orbit.radius = 4300 * ares.getRadius();
andromaqueModel.orbit.normalToPlane = Vector3.Up();

const andromaque = StarSystemHelper.MakeGasPlanet(starSystem, andromaqueModel);

/*const blackHoleModel = new BlackHoleModel(0.5, sunModel);
blackHoleModel.orbit.period = 60 * 60 * 24 * 365.25;
blackHoleModel.orbit.radius = 100 * ares.getRadius();
const blackHole = starSystem.makeBlackHole(blackHoleModel);*/

engine.init(true);

positionNearObjectBrightSide(starSystemView.scene.getActiveController(), planet, starSystem, 2);

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

    if(e.key === "o") {
        const landingPad = spacestation.handleDockingRequest();
        if(landingPad !== null && starSystemView.scene.getActiveController() === spaceshipController) {
            spaceshipController.spaceship.engageLandingOnPad(landingPad);
        }
    }

    if (e.key === "x") {
        let nbVertices = 0;
        let nbInstances = 0;
        planet.sides.forEach((side) => {
            side.executeOnEveryChunk((chunk) => {
                nbVertices += Settings.VERTEX_RESOLUTION * Settings.VERTEX_RESOLUTION;
                chunk.instancePatches.forEach((patch) => {
                    nbInstances += patch.getNbInstances();
                });
            });
        });
        console.log("Vertices", nbVertices, "Instances", nbInstances);
    }

    if (e.key === "y") {
        if (starSystemView.scene.getActiveController() === spaceshipController) {
            console.log("disembark");

            characterController.getTransform().setEnabled(true);
            characterController.getTransform().setAbsolutePosition(spaceshipController.getTransform().absolutePosition);
            translate(characterController.getTransform(), getForwardDirection(spaceshipController.getTransform()).scale(10));

            setRotationQuaternion(characterController.getTransform(), getRotationQuaternion(spaceshipController.getTransform()).clone());

            starSystemView.scene.setActiveController(characterController);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        } else if (starSystemView.scene.getActiveController() === characterController) {
            console.log("embark");

            characterController.getTransform().setEnabled(false);
            starSystemView.scene.setActiveController(spaceshipController);
            starSystemView.getStarSystem().postProcessManager.rebuild();
        }
    }
});

starSystemView.ui.setEnabled(true);
starSystemView.showUI();
starSystemView.getSpaceshipControls().spaceship.enableWarpDrive();
