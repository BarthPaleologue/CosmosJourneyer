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

import { type GasPlanetModel } from "@/backend/universe/orbitalObjects/gasPlanetModel";
import { type OrbitalObjectId } from "@/backend/universe/orbitalObjects/orbitalObjectId";

import { EarthSeaLevelPressure } from "@/utils/physics/constants";
import { degreesToRadians } from "@/utils/physics/unitConversions";

export function getSaturnModel(parentIds: ReadonlyArray<OrbitalObjectId>): GasPlanetModel {
    return {
        id: "saturn",
        name: "Saturn",
        type: "gasPlanet",
        radius: 58_232e3,
        mass: 5.683e26,
        axialTilt: degreesToRadians(26.73),
        siderealDaySeconds: 60 * 60 * 10.656,
        orbit: {
            parentIds: [...parentIds],
            semiMajorAxis: 1_433_449_370e3,
            eccentricity: 0.0565,
            inclination: degreesToRadians(2.49),
            longitudeOfAscendingNode: degreesToRadians(113.715),
            argumentOfPeriapsis: degreesToRadians(336.092),
            initialMeanAnomaly: 0,
            p: 2,
        },
        atmosphere: {
            pressure: EarthSeaLevelPressure,
            greenHouseEffectFactor: 0.5,
        },
        colorPalette: {
            type: "textured",
            textureId: "saturn",
        },
        rings: {
            innerRadius: 74_658e3,
            outerRadius: 136_775e3,
            type: "textured",
            textureId: "saturn",
        },
        seed: 0,
    };
}
