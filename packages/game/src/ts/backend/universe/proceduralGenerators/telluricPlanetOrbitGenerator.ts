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

import { SolarLuminosity } from "@/utils/physics/constants";
import { getBlackBodyLuminosity } from "@/utils/physics/thermodynamics";
import { astronomicalUnitToMeters } from "@/utils/physics/unitConversions";

/**
 * Uses stellar luminosity to determine a plausible semi-major axis range for a Telluric planet then samples it
 * @param stellarTemperature Temperature of the parent star in K
 * @param stellarRadius Radius of the parent star in meters
 * @param rng A random number generator function returning a uniform float in [0, 1)
 * @returns Semi-major axis of the telluric planet orbit in meters
 */
export function getTelluricPlanetOrbitRadius(
    stellarTemperature: number,
    stellarRadius: number,
    rng: () => number,
): number {
    const stellarLuminosity = getBlackBodyLuminosity(stellarTemperature, stellarRadius);
    const relativeLuminosity = stellarLuminosity / SolarLuminosity;

    // Avoid orbits too close to the star
    const lowerBound = (3 + 2 * rng()) * stellarRadius;

    // Snow line scaling (2.7 comes from empirical Solar System data)
    let upperBound = astronomicalUnitToMeters(2.7) * Math.sqrt(Math.max(relativeLuminosity, 0));
    if (upperBound <= lowerBound) {
        upperBound = lowerBound * 1.5;
    }

    // Log-uniform sample in [aMin, aMax] (from empirical Kepler data as found in https://www.pnas.org/doi/10.1073/pnas.1319909110)
    const uniformRandom = rng();
    return lowerBound * Math.exp(Math.log(upperBound / lowerBound) * uniformRandom);
}
