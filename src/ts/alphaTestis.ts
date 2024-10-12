//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "../styles/index.scss";

import { StarSystemController } from "./starSystem/starSystemController";

import { Settings } from "./settings";
import { positionNearObjectBrightSide } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { newSeededTelluricPlanetModel } from "./planets/telluricPlanet/telluricPlanetModel";
import { newSeededGasPlanetModel } from "./planets/gasPlanet/gasPlanetModel";
import { getMoonSeed, getPlanetName } from "./planets/common";
import { SpaceShipControlsInputs } from "./spaceship/spaceShipControlsInputs";
import { CustomStarSystemModel } from "./starSystem/customStarSystemModel";

import { CelestialBodyType } from "./architecture/celestialBody";
import { newSeededStarModel } from "./stellarObjects/star/starModel";
import { newSeededSpaceStationModel } from "./spacestation/spacestationModel";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

// const physicsViewer = new PhysicsViewer();
// physicsViewer.showBody(spaceshipController.aggregate.body);

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const starSystemModel = new CustomStarSystemModel(
    "Alpha Testis",
    {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0
    },
    [[CelestialBodyType.STAR, 4413.641464990006]],
    [
        [CelestialBodyType.TELLURIC_PLANET, 0.4233609183800225],
        [CelestialBodyType.TELLURIC_PLANET, 0.3725],
        [CelestialBodyType.GAS_PLANET, 0.28711440474126226]
    ],
    []
);

const starSystem = new StarSystemController(starSystemModel, starSystemView.scene);

await starSystemView.loadStarSystem(starSystem, false);

const sunModel = newSeededStarModel(starSystemModel.getStellarObjectSeed(0), "Weierstrass", null);
const sun = starSystem.addStar(sunModel, null);
sun.model.orbit.period = 60 * 60 * 24;

/*const secundaModel = new StarModel(-672446, sunModel);
secundaModel.orbit.radius = 30 * sunModel.radius;
secundaModel.orbit.period = 60 * 60;
const secunda = StarSystemHelper.makeStar(starSystem, secundaModel);

const terminaModel = new StarModel(756263, sunModel);
terminaModel.orbit.radius = 50 * sunModel.radius;
terminaModel.orbit.period = 60 * 60;
const termina = StarSystemHelper.makeStar(starSystem, terminaModel);*/

const planetModel = newSeededTelluricPlanetModel(starSystemModel.getPlanetSeed(0), "Hécate", sun.model);
planetModel.physicalProperties.minTemperature = -40;
planetModel.physicalProperties.maxTemperature = 30;

planetModel.orbit.period = 60 * 60 * 24 * 365.25;
planetModel.orbit.radius = 25000 * planetModel.radius;
planetModel.orbit.normalToPlane = Vector3.Up();

const planet = starSystem.addTelluricPlanet(planetModel);

const spaceStationModel = newSeededSpaceStationModel(0, starSystem.model, planetModel);
const spaceStation = starSystem.addSpaceStation(spaceStationModel, planet);

//physicsViewer.showBody(spaceStation.aggregate.body);
/*for(const landingpad of spaceStation.landingPads) {
    physicsViewer.showBody(landingpad.aggregate.body);
}*/

const moonModel = newSeededTelluricPlanetModel(getMoonSeed(planetModel, 0), "Manaleth", planetModel);
moonModel.physicalProperties.mass = 2;
moonModel.physicalProperties.rotationPeriod = 7 * 60 * 60;
moonModel.physicalProperties.minTemperature = -180;
moonModel.physicalProperties.maxTemperature = 200;
moonModel.physicalProperties.waterAmount = 0.9;

moonModel.orbit.period = moonModel.physicalProperties.rotationPeriod;
moonModel.orbit.radius = 8 * planet.getRadius();
moonModel.orbit.normalToPlane = Vector3.Up();

const moon = starSystem.addSatellite(moonModel, planet);

const aresModel = newSeededTelluricPlanetModel(0.3725, getPlanetName(1, starSystemModel.name, sun.model), sun.model);
aresModel.physicalProperties.mass = 7;
aresModel.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
aresModel.physicalProperties.minTemperature = -30;
aresModel.physicalProperties.maxTemperature = 20;
aresModel.physicalProperties.pressure = 0.5;
aresModel.physicalProperties.waterAmount = 0.2;
aresModel.physicalProperties.oceanLevel = 0;

aresModel.orbit.period = 60 * 60 * 24 * 365.24;
aresModel.orbit.radius = 25020 * planet.getRadius();
aresModel.orbit.normalToPlane = Vector3.Up();

//aresModel.terrainSettings.continents_fragmentation = 0.0;
//aresModel.terrainSettings.continent_base_height = 10e3;
//aresModel.terrainSettings.max_mountain_height = 20e3;

const ares = starSystem.addTelluricPlanet(aresModel);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.OCEAN), 1);
ares.postProcesses.splice(ares.postProcesses.indexOf(PostProcessType.CLOUDS), 1);

ares.material.updateConstants();

const andromaqueModel = newSeededGasPlanetModel(0.28711440474126226, "Andromaque", sun.model);
andromaqueModel.orbit.period = 60 * 60 * 24 * 365.25;
andromaqueModel.orbit.radius = 25300 * ares.getRadius();
andromaqueModel.orbit.normalToPlane = Vector3.Up();

const andromaque = starSystem.addGasPlanet(andromaqueModel);

/*const blackHoleModel = new BlackHoleModel(0.5, sunModel);
blackHoleModel.orbit.period = 60 * 60 * 24 * 365.25;
blackHoleModel.orbit.radius = 100 * ares.getRadius();
const blackHole = starSystem.makeBlackHole(blackHoleModel);*/

engine.init(true);

positionNearObjectBrightSide(starSystemView.scene.getActiveControls(), planet, starSystem, 2);

const aresAtmosphere = starSystemView.postProcessManager.getAtmosphere(ares);
if (aresAtmosphere) {
    aresAtmosphere.atmosphereUniforms.redWaveLength = 500;
    aresAtmosphere.atmosphereUniforms.greenWaveLength = 680;
    aresAtmosphere.atmosphereUniforms.blueWaveLength = 670;
} else {
    console.warn("No atmosphere found for Ares");
}

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;

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
});

starSystemView.getSpaceshipControls().spaceship.enableWarpDrive();
SpaceShipControlsInputs.setEnabled(true);
