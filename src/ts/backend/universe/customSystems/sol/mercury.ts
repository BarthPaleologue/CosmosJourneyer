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

import { astronomicalUnitToMeters, degreesToRadians } from "@/utils/physics/unitConversions";

import { type OrbitalObjectId } from "../../orbitalObjects/orbitalObjectId";
import { OrbitalObjectType } from "../../orbitalObjects/orbitalObjectType";
import { type TelluricPlanetModel } from "../../orbitalObjects/telluricPlanetModel";

export function getMercuryModel(parentIds: ReadonlyArray<OrbitalObjectId>) {
    return {
        id: "mercury",
        name: "Mercury",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 2_439.7e3,
        mass: 3.301e23,
        axialTilt: degreesToRadians(0.034),
        siderealDaySeconds: 60 * 60 * 24 * 58.646,
        waterAmount: 0,
        temperature: {
            min: 437,
            max: 437,
        },
        orbit: {
            parentIds: [...parentIds],
            semiMajorAxis: astronomicalUnitToMeters(0.38),
            eccentricity: 0.2056,
            p: 2,
            inclination: degreesToRadians(7),
            longitudeOfAscendingNode: degreesToRadians(48.331),
            argumentOfPeriapsis: degreesToRadians(29.124),
            initialMeanAnomaly: 0,
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0,
        },
        atmosphere: null,
        rings: null,
        clouds: null,
        ocean: null,
        seed: 0,
    } as const satisfies TelluricPlanetModel;
}
