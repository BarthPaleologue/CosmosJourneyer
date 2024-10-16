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

import { Settings } from "./settings";
import { positionNearObjectBrightSide } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { newSeededGasPlanetModel } from "./planets/gasPlanet/gasPlanetModel";
import { SpaceShipControlsInputs } from "./spaceship/spaceShipControlsInputs";

import { newSeededStarModel } from "./stellarObjects/star/starModel";
import { newSeededSpaceStationModel } from "./spacestation/spacestationModel";
import { StarSystemModel } from "./starSystem/starSystemModel";
import { StarSystemCoordinates } from "./utils/coordinates/universeCoordinates";
import { CustomSystemRegistry } from "./starSystem/customSystemRegistry";
import { newSeededTelluricSatelliteModel } from "./planets/telluricPlanet/telluricSatelliteModel";
import { newSeededTelluricPlanetModel } from "./planets/telluricPlanet/telluricPlanetModel";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

// const physicsViewer = new PhysicsViewer();
// physicsViewer.showBody(spaceshipController.aggregate.body);

console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

const systemName = "Alpha Testis";
const systemCoordinates: StarSystemCoordinates = {
    starSectorX: 0,
    starSectorY: 0,
    starSectorZ: 0,
    localX: 0,
    localY: 0,
    localZ: 0
};

const sunModel = newSeededStarModel(420, "Weierstrass", []);
sunModel.physics.blackBodyTemperature = 5778;
sunModel.orbit.period = 60 * 60 * 24;

/*const secundaModel = new StarModel(-672446, sunModel);
secundaModel.orbit.radius = 30 * sunModel.radius;
secundaModel.orbit.period = 60 * 60;
const secunda = StarSystemHelper.makeStar(starSystem, secundaModel);

const terminaModel = new StarModel(756263, sunModel);
terminaModel.orbit.radius = 50 * sunModel.radius;
terminaModel.orbit.period = 60 * 60;
const termina = StarSystemHelper.makeStar(starSystem, terminaModel);*/

const hecateModel = newSeededTelluricPlanetModel(253, "Hécate", [sunModel]);
hecateModel.physics.minTemperature = -40;
hecateModel.physics.maxTemperature = 30;

hecateModel.orbit.period = 60 * 60 * 24 * 365.25;
hecateModel.orbit.radius = 25000 * hecateModel.radius;
hecateModel.orbit.normalToPlane = Vector3.Up();

const spaceStationModel = newSeededSpaceStationModel(0, [sunModel], systemCoordinates, [hecateModel]);

//physicsViewer.showBody(spaceStation.aggregate.body);
/*for(const landingpad of spaceStation.landingPads) {
    physicsViewer.showBody(landingpad.aggregate.body);
}*/

const moonModel = newSeededTelluricSatelliteModel(23, "Manaleth", [hecateModel]);
moonModel.physics.mass = 2;
moonModel.physics.rotationPeriod = 7 * 60 * 60;
moonModel.physics.minTemperature = -180;
moonModel.physics.maxTemperature = 200;
moonModel.physics.waterAmount = 0.9;

moonModel.orbit.period = moonModel.physics.rotationPeriod;
moonModel.orbit.radius = 8 * hecateModel.radius;
moonModel.orbit.normalToPlane = Vector3.Up();

const aresModel = newSeededTelluricPlanetModel(0.3725, "Ares", [sunModel]);
if (aresModel.clouds !== null) aresModel.clouds.coverage = 1;
aresModel.physics.mass = 7;
aresModel.physics.rotationPeriod = (24 * 60 * 60) / 30;
aresModel.physics.minTemperature = -30;
aresModel.physics.maxTemperature = 20;
aresModel.physics.pressure = 0.5;
aresModel.physics.waterAmount = 0.2;
aresModel.physics.oceanLevel = 0;

aresModel.orbit.period = 60 * 60 * 24 * 365.24;
aresModel.orbit.radius = 25020 * hecateModel.radius;
aresModel.orbit.normalToPlane = Vector3.Up();

//aresModel.terrainSettings.continents_fragmentation = 0.0;
//aresModel.terrainSettings.continent_base_height = 10e3;
//aresModel.terrainSettings.max_mountain_height = 20e3;

const andromaqueModel = newSeededGasPlanetModel(0.28711440474126226, "Andromaque", [sunModel]);
andromaqueModel.orbit.period = 60 * 60 * 24 * 365.25;
andromaqueModel.orbit.radius = 25300 * hecateModel.radius;
andromaqueModel.orbit.normalToPlane = Vector3.Up();

const starSystemModel: StarSystemModel = {
    name: systemName,
    coordinates: systemCoordinates,
    subSystems: [
        {
            stellarObjects: [sunModel],
            planetarySystems: [
                { planets: [hecateModel], satellites: [moonModel], spaceStations: [spaceStationModel] },
                { planets: [aresModel], satellites: [], spaceStations: [] },
                { planets: [andromaqueModel], satellites: [], spaceStations: [] }
            ],
            anomalies: [],
            spaceStations: []
        }
    ]
};

CustomSystemRegistry.RegisterSystem(starSystemModel);

const starSystem = await starSystemView.loadStarSystem(starSystemModel);

engine.init(true);

const planets = starSystem.getPlanets();

const hecate = planets.find((planet) => planet.model === hecateModel);
if (hecate === undefined) {
    throw new Error("Hécate not found");
}

positionNearObjectBrightSide(starSystemView.scene.getActiveControls(), hecate, starSystem, 2);

const ares = planets.find((planet) => planet.model === aresModel);
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
