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

import {
    generateStarModel,
    generateTelluricPlanetModel,
    generateTelluricSatelliteModel,
} from "@cosmos-journeyer/universe-generation";
import { type StarSystemCoordinates, type StarSystemModel } from "@cosmos-journeyer/universe-model";

export function getEclipseTestSystemModel(): StarSystemModel {
    const systemName = "Eclipse Test";
    const systemCoordinates: StarSystemCoordinates = {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0,
    };

    const star = generateStarModel("star0", 420, "Star", []);

    const planet = generateTelluricPlanetModel("planet", 12, "Planet", [star]);
    planet.orbit.inclination = 0;
    planet.orbit.initialMeanAnomaly = 0;

    const moon = generateTelluricSatelliteModel("moon", 6, "Moon", [planet], [star]);
    moon.orbit.inclination = 0;
    moon.orbit.initialMeanAnomaly = Math.PI;

    return {
        name: systemName,
        coordinates: systemCoordinates,
        stellarObjects: [star],
        planets: [planet],
        satellites: [moon],
        anomalies: [],
        orbitalFacilities: [],
    };
}
