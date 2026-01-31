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
 * Samples a plausible semi-major axis for a gas giant given the properties of its parent star.
 * @param stellarTemperature Temperature of the parent star in K
 * @param stellarRadius Radius of the parent star in meters
 * @param rng A random number generator function returning a uniform float in [0, 1)
 * @returns Semi-major axis in meters
 */
export function getGasPlanetOrbitRadius(stellarTemperature: number, stellarRadius: number, rng: () => number): number {
    const stellarLuminosity = getBlackBodyLuminosity(stellarTemperature, stellarRadius);
    const relativeLuminosity = stellarLuminosity / SolarLuminosity;

    // Empirical Solar System-calibrated snow line heuristic
    const snowLine = astronomicalUnitToMeters(2.7) * Math.sqrt(relativeLuminosity);

    // Hot Jupiter modeling: around 1% chance (see https://academic.oup.com/mnras/article/516/1/75/6654884)
    const pHotJupiter = 0.01;
    if (rng() < pHotJupiter) {
        // Keep clear of the star and also well interior to the snow line
        const aMin = Math.max(10 * stellarRadius, astronomicalUnitToMeters(0.02));
        const aMax = Math.min(astronomicalUnitToMeters(0.1), snowLine * 0.5);

        const upper = Math.max(aMax, aMin * 1.5);

        // Log-uniform inside this narrow inner region
        const u = rng();
        return aMin * Math.exp(Math.log(upper / aMin) * u);
    }

    const innerFactor = 1.3 + 0.9 * rng();
    const outerFactor = 1.0 + 2.0 * rng();

    const aMin = Math.max(snowLine * innerFactor, 10 * stellarRadius);
    let aMax = snowLine * outerFactor;
    if (aMax <= aMin) {
        aMax = aMin * 1.5;
    }

    const u = rng();
    const sqrtMin = Math.sqrt(aMin);
    const sqrtMax = Math.sqrt(aMax);
    const sqrtA = sqrtMin + (sqrtMax - sqrtMin) * u;
    return sqrtA * sqrtA;
}
