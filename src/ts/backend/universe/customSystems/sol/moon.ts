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

import { degreesToRadians } from "@/utils/physics/unitConversions";

import { type OrbitalObjectId } from "../../orbitalObjects/orbitalObjectId";
import { OrbitalObjectType } from "../../orbitalObjects/orbitalObjectType";
import { type TelluricSatelliteModel } from "../../orbitalObjects/telluricSatelliteModel";

export function getMoonModel(parentIds: ReadonlyArray<OrbitalObjectId>) {
    return {
        id: "moon",
        name: "Moon",
        type: OrbitalObjectType.TELLURIC_SATELLITE,
        radius: 1_737.1e3,
        mass: 7.342e22,
        axialTilt: degreesToRadians(6.68),
        siderealDaySeconds: 60 * 60 * 24 * 27.322,
        waterAmount: 0,
        temperature: {
            min: 100,
            max: 100,
        },
        orbit: {
            parentIds: [...parentIds],
            semiMajorAxis: 384_400e3,
            eccentricity: 0.0549,
            inclination: degreesToRadians(5.145),
            longitudeOfAscendingNode: degreesToRadians(125.08),
            argumentOfPeriapsis: degreesToRadians(318.15),
            initialMeanAnomaly: 0,
            p: 2,
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
        clouds: null,
        ocean: null,
        seed: 0,
    } as const satisfies TelluricSatelliteModel;
}
