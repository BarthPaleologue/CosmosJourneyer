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
import { newSeededTelluricPlanetModel } from "./planets/telluricPlanet/telluricPlanetModel";
import { newSeededGasPlanetModel } from "./planets/gasPlanet/gasPlanetModel";
import { getMoonSeed } from "./planets/common";
import { SpaceShipControlsInputs } from "./spaceship/spaceShipControlsInputs";
import { CustomStarSystemModel } from "./starSystem/customStarSystemModel";

import { newSeededStarModel } from "./stellarObjects/star/starModel";
import { newSeededSpaceStationModel } from "./spacestation/spacestationModel";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

// const physicsViewer = new PhysicsViewer();
// physicsViewer.showBody(spaceshipController.aggregate.body);

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const systemName = "Alpha Testis";
const systemCoordinates = {
    starSectorX: 0,
    starSectorY: 0,
    starSectorZ: 0,
    localX: 0,
    localY: 0,
    localZ: 0
};

const sunModel = newSeededStarModel(42, "Weierstrass", null);
sunModel.orbit.period = 60 * 60 * 24;

/*const secundaModel = new StarModel(-672446, sunModel);
secundaModel.orbit.radius = 30 * sunModel.radius;
secundaModel.orbit.period = 60 * 60;
const secunda = StarSystemHelper.makeStar(starSystem, secundaModel);

const terminaModel = new StarModel(756263, sunModel);
terminaModel.orbit.radius = 50 * sunModel.radius;
terminaModel.orbit.period = 60 * 60;
const termina = StarSystemHelper.makeStar(starSystem, terminaModel);*/

const hecateModel = newSeededTelluricPlanetModel(253, "Hécate", sunModel);
hecateModel.physicalProperties.minTemperature = -40;
hecateModel.physicalProperties.maxTemperature = 30;

hecateModel.orbit.period = 60 * 60 * 24 * 365.25;
hecateModel.orbit.radius = 25000 * hecateModel.radius;
hecateModel.orbit.normalToPlane = Vector3.Up();

const spaceStationModel = newSeededSpaceStationModel(0, sunModel, systemCoordinates, hecateModel);

//physicsViewer.showBody(spaceStation.aggregate.body);
/*for(const landingpad of spaceStation.landingPads) {
    physicsViewer.showBody(landingpad.aggregate.body);
}*/

const moonModel = newSeededTelluricPlanetModel(getMoonSeed(hecateModel, 0), "Manaleth", hecateModel);
moonModel.physicalProperties.mass = 2;
moonModel.physicalProperties.rotationPeriod = 7 * 60 * 60;
moonModel.physicalProperties.minTemperature = -180;
moonModel.physicalProperties.maxTemperature = 200;
moonModel.physicalProperties.waterAmount = 0.9;

moonModel.orbit.period = moonModel.physicalProperties.rotationPeriod;
moonModel.orbit.radius = 8 * hecateModel.radius;
moonModel.orbit.normalToPlane = Vector3.Up();

const aresModel = newSeededTelluricPlanetModel(0.3725, "Ares", sunModel);
aresModel.physicalProperties.mass = 7;
aresModel.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
aresModel.physicalProperties.minTemperature = -30;
aresModel.physicalProperties.maxTemperature = 20;
aresModel.physicalProperties.pressure = 0.5;
aresModel.physicalProperties.waterAmount = 0.2;
aresModel.physicalProperties.oceanLevel = 0;

aresModel.orbit.period = 60 * 60 * 24 * 365.24;
aresModel.orbit.radius = 25020 * hecateModel.radius;
aresModel.orbit.normalToPlane = Vector3.Up();

//aresModel.terrainSettings.continents_fragmentation = 0.0;
//aresModel.terrainSettings.continent_base_height = 10e3;
//aresModel.terrainSettings.max_mountain_height = 20e3;

const andromaqueModel = newSeededGasPlanetModel(0.28711440474126226, "Andromaque", sunModel);
andromaqueModel.orbit.period = 60 * 60 * 24 * 365.25;
andromaqueModel.orbit.radius = 25300 * aresModel.radius;
andromaqueModel.orbit.normalToPlane = Vector3.Up();

const starSystemModel = new CustomStarSystemModel(
    systemName,
    {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0
    },
    [sunModel],
    [
        { planet: hecateModel, satellites: [moonModel] },
        { planet: aresModel, satellites: [] },
        { planet: andromaqueModel, satellites: [] }
    ],
    []
);

const starSystem = new StarSystemController(starSystemModel, starSystemView.scene);

await starSystemView.loadStarSystem(starSystem, true);

engine.init(true);

const hecate = starSystem.planets.find((planet) => planet.model === hecateModel);
if (hecate === undefined) {
    throw new Error("Hécate not found");
}

positionNearObjectBrightSide(starSystemView.scene.getActiveControls(), hecate, starSystem, 2);

const ares = starSystem.planets.find((planet) => planet.model === aresModel);
if (ares === undefined) {
    throw new Error("Ares not found");
}

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
});

starSystemView.getSpaceshipControls().spaceship.enableWarpDrive();
SpaceShipControlsInputs.setEnabled(true);
