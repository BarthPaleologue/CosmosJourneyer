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

import { Vector3 } from "@babylonjs/core";
import { Tools } from "@babylonjs/core/Misc/tools";

import { newSeededGasPlanetModel } from "../../planets/gasPlanet/gasPlanetModelGenerator";
import { newSeededTelluricPlanetModel } from "../../planets/telluricPlanet/telluricPlanetModelGenerator";
import { newSeededTelluricSatelliteModel } from "../../planets/telluricPlanet/telluricSatelliteModelGenerator";
import { Settings } from "../../settings";
import { newSeededSpaceStationModel } from "../../spacestation/spaceStationModelGenerator";
import { newSeededStarModel } from "../../stellarObjects/star/starModelGenerator";
import { StarSystemCoordinates } from "../../utils/coordinates/starSystemCoordinates";
import { celsiusToKelvin, getOrbitRadiusFromPeriod } from "../../utils/physics";
import { StarSystemModel } from "../starSystemModel";

export function getAlphaTestisSystemModel(): StarSystemModel {
    const systemName = "Alpha Testis";
    const systemCoordinates: StarSystemCoordinates = {
        starSectorX: 0,
        starSectorY: 1,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0
    };

    const weierstrass = newSeededStarModel("star0", 420, "Weierstrass", []);
    weierstrass.blackBodyTemperature = 5778;

    const hecate = newSeededTelluricPlanetModel("hecate", 253, "Hécate", [weierstrass]);
    hecate.temperature.min = celsiusToKelvin(-40);
    hecate.temperature.max = celsiusToKelvin(30);

    hecate.orbit.semiMajorAxis = 21000 * hecate.radius;

    const spaceStation = newSeededSpaceStationModel("hecate->station", 0, systemCoordinates, Vector3.Zero(), [hecate]);

    const manaleth = newSeededTelluricSatelliteModel("hecate->manaleth", 23, "Manaleth", [hecate]);
    manaleth.orbit.inclination = Tools.ToRadians(45);
    manaleth.orbit.semiMajorAxis = getOrbitRadiusFromPeriod(manaleth.siderealDaySeconds, hecate.mass);

    const ares = newSeededTelluricPlanetModel("ares", 0.3725, "Ares", [weierstrass]);
    if (ares.clouds !== null) ares.clouds.coverage = 1;
    if (ares.atmosphere !== null) ares.atmosphere.pressure = Settings.EARTH_SEA_LEVEL_PRESSURE * 0.5;

    ares.orbit.semiMajorAxis = 25100 * hecate.radius;

    const andromaque = newSeededGasPlanetModel("andromaque", 0.28711440474126226, "Andromaque", [weierstrass]);
    andromaque.orbit.semiMajorAxis = 25300 * hecate.radius;
    andromaque.orbit.eccentricity = 0.8;

    return {
        name: systemName,
        coordinates: systemCoordinates,
        stellarObjects: [weierstrass],
        planets: [hecate, ares, andromaque],
        satellites: [manaleth],
        anomalies: [],
        orbitalFacilities: [spaceStation]
    };
}
