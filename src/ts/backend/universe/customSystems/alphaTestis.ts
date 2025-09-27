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

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";

import { EarthSeaLevelPressure } from "@/utils/physics/constants";
import { getOrbitRadiusFromPeriod } from "@/utils/physics/orbit";
import { celsiusToKelvin, degreesToRadians } from "@/utils/physics/unitConversions";

import { newSeededGasPlanetModel } from "../proceduralGenerators/gasPlanetModelGenerator";
import { newSeededSpaceStationModel } from "../proceduralGenerators/orbitalFacilities/spaceStationModelGenerator";
import { newSeededStarModel } from "../proceduralGenerators/stellarObjects/starModelGenerator";
import { newSeededTelluricPlanetModel } from "../proceduralGenerators/telluricPlanetModelGenerator";
import { newSeededTelluricSatelliteModel } from "../proceduralGenerators/telluricSatelliteModelGenerator";
import { type StarSystemModel } from "../starSystemModel";

export function getAlphaTestisSystemModel(): StarSystemModel {
    const systemName = "Alpha Testis";
    const systemCoordinates: StarSystemCoordinates = {
        starSectorX: 0,
        starSectorY: 1,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0,
    };

    const weierstrass = newSeededStarModel("star0", 420, "Weierstrass", []);
    weierstrass.blackBodyTemperature = 5778;

    const hecate = newSeededTelluricPlanetModel("hecate", 253, "Hécate", [weierstrass]);
    hecate.temperature.min = celsiusToKelvin(-40);
    hecate.temperature.max = celsiusToKelvin(30);

    hecate.orbit.semiMajorAxis = 21000 * hecate.radius;

    const spaceStation = newSeededSpaceStationModel("hecate->station", 0, systemCoordinates, { x: 0, y: 0, z: 0 }, [
        hecate,
    ]);

    const manaleth = newSeededTelluricSatelliteModel("hecate->manaleth", 23, "Manaleth", [hecate]);
    manaleth.orbit.inclination = degreesToRadians(45);
    manaleth.orbit.semiMajorAxis = getOrbitRadiusFromPeriod(manaleth.siderealDaySeconds, hecate.mass);

    const ares = newSeededTelluricPlanetModel("ares", 0.3725, "Ares", [weierstrass]);
    if (ares.clouds !== null) ares.clouds.coverage = 1;
    if (ares.atmosphere !== null) ares.atmosphere.seaLevelPressure = EarthSeaLevelPressure * 0.5;

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
        orbitalFacilities: [spaceStation],
    };
}
