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

import { EarthSeaLevelPressure } from "@/utils/physics/constants";
import { celsiusToKelvin, degreesToRadians } from "@/utils/physics/unitConversions";

export function getEarthModel(parentIds: ReadonlyArray<OrbitalObjectId>) {
    return {
        id: "earth",
        name: "Earth",
        type: OrbitalObjectType.TELLURIC_PLANET,
        radius: 6_371e3,
        mass: 5.972e24,
        axialTilt: degreesToRadians(23.44),
        siderealDaySeconds: 60 * 60 * 24,
        waterAmount: 1,
        temperature: {
            min: celsiusToKelvin(-50),
            max: celsiusToKelvin(50),
        },
        orbit: {
            parentIds: [...parentIds],
            semiMajorAxis: 149_597_870e3,
            eccentricity: 0.0167,
            inclination: degreesToRadians(0),
            longitudeOfAscendingNode: degreesToRadians(0),
            argumentOfPeriapsis: degreesToRadians(114.20783),
            initialMeanAnomaly: 0,
            p: 2,
        },
        terrainSettings: {
            continents_frequency: 1,
            continents_fragmentation: 0.65,

            bumps_frequency: 30,

            max_bump_height: 1.5e3,
            max_mountain_height: 10e3,
            continent_base_height: 10e3 * 1.9,

            mountains_frequency: 360,
        },
        rings: null,
        atmosphere: {
            seaLevelPressure: EarthSeaLevelPressure,
            greenHouseEffectFactor: 0.5,
            gasMix: [
                ["N2", 0.78],
                ["O2", 0.21],
                ["Ar", 0.01],
            ],
        },
        clouds: {
            layerRadius: 6_371e3 + 30e3,
            smoothness: 0.7,
            specularPower: 2,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0.5,
            sharpness: 2.5,
            color: { r: 0.8, g: 0.8, b: 0.8 },
            worleySpeed: 0.0005,
            detailSpeed: 0.003,
        },
        ocean: {
            depth: 10e3,
        },
        seed: 0,
    } as const satisfies TelluricPlanetModel;
}
