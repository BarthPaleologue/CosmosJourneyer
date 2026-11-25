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
    degreesToRadians,
    durationToSeconds,
    EarthSeaLevelPressure,
    JupiterMagneticDipoleMoment,
    meters,
    radians,
    seconds,
} from "@cosmos-journeyer/physics";
import type { GasPlanetModel, OrbitalObjectId } from "@cosmos-journeyer/universe-model";

/**
 * @param parentIds - IDs of the containing system and orbital parent used to construct its model ID.
 * @returns Jupiter model with its configured physical properties and orbit.
 */
export function getJupiterModel(parentIds: ReadonlyArray<OrbitalObjectId>): GasPlanetModel {
    return {
        id: "jupiter",
        name: "Jupiter",
        type: "gasPlanet",
        radius: 69_911e3,
        mass: 1.898e27,
        spin: {
            siderealPeriod: seconds(durationToSeconds({ hours: 9, minutes: 55, seconds: 30 })),
            axialTilt: radians(degreesToRadians(3.13)),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
        },
        orbit: {
            parentIds: [...parentIds],
            semiMajorAxis: meters(778_547_200e3),
            eccentricity: 0.0934,
            plane: {
                inclination: radians(degreesToRadians(1.85)),
                longitudeOfAscendingNode: radians(degreesToRadians(49.558)),
            },
            argumentOfPeriapsis: radians(degreesToRadians(286.502)),
            initialMeanAnomaly: radians(0),
            p: 2,
        },
        atmosphere: {
            pressure: EarthSeaLevelPressure,
            greenHouseEffectFactor: 0.7,
        },
        magneticField: {
            north: { latitude: degreesToRadians(80), longitude: 0 },
            magnitude: JupiterMagneticDipoleMoment,
        },
        colorPalette: {
            type: "textured",
            textureId: "jupiter",
        },
        rings: null,
        seed: 0,
    };
}
