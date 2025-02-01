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
import { newSeededGasPlanetModel } from "./planets/gasPlanet/gasPlanetModel";
import { SpaceShipControlsInputs } from "./spaceship/spaceShipControlsInputs";
import { newSeededStarModel } from "./stellarObjects/star/starModel";
import { StarSystemModel } from "./starSystem/starSystemModel";
import { StarSystemCoordinates } from "./utils/coordinates/universeCoordinates";
import { newSeededTelluricSatelliteModel } from "./planets/telluricPlanet/telluricSatelliteModel";
import { newSeededTelluricPlanetModel } from "./planets/telluricPlanet/telluricPlanetModel";
import { newSeededSpaceElevatorModel } from "./spacestation/spaceElevatorModel";
import { celsiusToKelvin, getOrbitRadiusFromPeriod } from "./utils/physics";
import { Tools } from "@babylonjs/core/Misc/tools";

const engine = await CosmosJourneyer.CreateAsync();
engine.setAutoSaveEnabled(false);

const starSystemView = engine.starSystemView;

// const physicsViewer = new PhysicsViewer();
// physicsViewer.showBody(spaceshipController.aggregate.body);

const systemName = "Alpha Testis";
const systemCoordinates: StarSystemCoordinates = {
    starSectorX: 0,
    starSectorY: 1,
    starSectorZ: 0,
    localX: 0,
    localY: 0,
    localZ: 0
};

const sunModel = newSeededStarModel(420, "Weierstrass", []);
sunModel.physics.blackBodyTemperature = 5778;

/*const secundaModel = new StarModel(-672446, sunModel);
secundaModel.orbit.semiMajorAxis = 30 * sunModel.radius;
secundaModel.orbit.period = 60 * 60;
const secunda = StarSystemHelper.makeStar(starSystem, secundaModel);

const terminaModel = new StarModel(756263, sunModel);
terminaModel.orbit.semiMajorAxis = 50 * sunModel.radius;
terminaModel.orbit.period = 60 * 60;
const termina = StarSystemHelper.makeStar(starSystem, terminaModel);*/

const hecateModel = newSeededTelluricPlanetModel(253, "Hécate", [sunModel]);
hecateModel.physics.minTemperature = celsiusToKelvin(-40);
hecateModel.physics.maxTemperature = celsiusToKelvin(30);

hecateModel.physics.siderealDaySeconds = 6 * 60 * 60;

hecateModel.orbit.semiMajorAxis = 21000 * hecateModel.radius;

const spaceStationModel = newSeededSpaceElevatorModel(
    0,
    [sunModel],
    systemCoordinates,
    engine.starSystemDatabase.getSystemGalacticPosition(systemCoordinates),
    hecateModel
);

//physicsViewer.showBody(spaceStation.aggregate.body);
/*for(const landingpad of spaceStation.landingPads) {
    physicsViewer.showBody(landingpad.aggregate.body);
}*/

const moonModel = newSeededTelluricSatelliteModel(23, "Manaleth", [hecateModel]);
moonModel.physics.mass = 2;
moonModel.physics.siderealDaySeconds = 28 * 60 * 60;
moonModel.physics.minTemperature = celsiusToKelvin(-180);
moonModel.physics.maxTemperature = celsiusToKelvin(200);
moonModel.physics.waterAmount = 0.9;

moonModel.orbit.inclination = Tools.ToRadians(45);

moonModel.orbit.semiMajorAxis = getOrbitRadiusFromPeriod(
    moonModel.physics.siderealDaySeconds,
    hecateModel.physics.mass
);

const aresModel = newSeededTelluricPlanetModel(0.3725, "Ares", [sunModel]);
if (aresModel.clouds !== null) aresModel.clouds.coverage = 1;
aresModel.physics.mass = 7;
aresModel.physics.siderealDaySeconds = (24 * 60 * 60) / 30;
aresModel.physics.minTemperature = celsiusToKelvin(-30);
aresModel.physics.maxTemperature = celsiusToKelvin(20);
aresModel.physics.pressure = Settings.EARTH_SEA_LEVEL_PRESSURE * 0.5;
aresModel.physics.waterAmount = 0.2;
aresModel.physics.oceanLevel = 0;

aresModel.orbit.semiMajorAxis = 25100 * hecateModel.radius;

//aresModel.terrainSettings.continents_fragmentation = 0.0;
//aresModel.terrainSettings.continent_base_height = 10e3;
//aresModel.terrainSettings.max_mountain_height = 20e3;

const andromaqueModel = newSeededGasPlanetModel(0.28711440474126226, "Andromaque", [sunModel]);
andromaqueModel.orbit.semiMajorAxis = 25300 * hecateModel.radius;
andromaqueModel.orbit.eccentricity = 0.8;

const starSystemModel: StarSystemModel = {
    name: systemName,
    coordinates: systemCoordinates,
    subSystems: [
        {
            stellarObjects: [sunModel],
            planetarySystems: [
                {
                    planets: [hecateModel],
                    satellites: [moonModel],
                    orbitalFacilities: [spaceStationModel]
                },
                { planets: [aresModel], satellites: [], orbitalFacilities: [] },
                { planets: [andromaqueModel], satellites: [], orbitalFacilities: [] }
            ],
            anomalies: [],
            orbitalFacilities: []
        }
    ]
};

engine.starSystemDatabase.registerCustomSystem(starSystemModel);

const starSystem = await starSystemView.loadStarSystem(starSystemModel);

await engine.init(true);

const planets = starSystem.getTelluricPlanets();

const hecate = planets.find((planet) => planet.model === hecateModel);
if (hecate === undefined) {
    throw new Error("Hécate not found");
}

positionNearObjectBrightSide(starSystemView.scene.getActiveControls(), hecate, starSystem, 2);

const ares = planets.find((planet) => planet.model === aresModel);
if (ares === undefined) {
    throw new Error("Ares not found");
}

if (ares.atmosphereUniforms !== null) {
    ares.atmosphereUniforms.rayleighScatteringCoefficients.x *= 4;
    ares.atmosphereUniforms.rayleighScatteringCoefficients.z /= 3;
} else {
    console.warn("No atmosphere found for Ares");
}

document.addEventListener("keydown", (e) => {
    if (engine.isPaused()) return;
});

starSystemView.getSpaceshipControls().getSpaceship().enableWarpDrive();
SpaceShipControlsInputs.setEnabled(true);
