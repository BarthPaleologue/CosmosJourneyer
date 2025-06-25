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

import { type OrbitalObjectId } from "@/backend/universe/orbitalObjects/orbitalObjectId";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";

import { barToPascal, celsiusToKelvin, degreesToRadians } from "@/utils/physics/unitConversions";

export function getMarsModel(parentIds: ReadonlyArray<OrbitalObjectId>) {
    return {
        id: "mars",
        name: "Mars",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 3_389.5e3,
        mass: 6.4171e23,
        axialTilt: degreesToRadians(25.19),
        siderealDaySeconds: 60 * 60 * 24 * 1.027,
        waterAmount: 0,
        temperature: {
            min: celsiusToKelvin(-140),
            max: celsiusToKelvin(20),
        },
        orbit: {
            parentIds: [...parentIds],
            semiMajorAxis: 227_939_200e3,
            eccentricity: 0.0934,
            inclination: degreesToRadians(1.85),
            longitudeOfAscendingNode: degreesToRadians(49.558),
            argumentOfPeriapsis: degreesToRadians(286.502),
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
        atmosphere: {
            seaLevelPressure: barToPascal(0.006),
            greenHouseEffectFactor: 0.1,
            gasMix: [
                ["CO2", 0.95],
                ["N2", 0.03],
                ["Ar", 0.01],
                ["O2", 0.01],
            ],
        },
        rings: null,
        clouds: null,
        ocean: null,
        seed: 0,
    } as const satisfies TelluricPlanetModel;
}
