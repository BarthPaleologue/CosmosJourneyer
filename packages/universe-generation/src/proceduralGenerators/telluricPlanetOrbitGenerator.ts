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

import { getSilicateRockSublimationLine, getWaterIceFrostLine } from "@cosmos-journeyer/physics";

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
    // Telluric worlds cannot exist where silicate rocks sublimate
    const lowerBound = getSilicateRockSublimationLine(stellarTemperature, stellarRadius);

    // Telluric worlds are unlikely to form beyond the water ice frost line
    // Beyond the frost line => more solid material (ice is stable) => bigger planets => trap large quantities of gas => gas giants
    const upperBound = getWaterIceFrostLine(stellarTemperature, stellarRadius);

    // Log-uniform sample in [aMin, aMax] (from empirical Kepler data as found in https://www.pnas.org/doi/10.1073/pnas.1319909110)
    const uniformRandom = rng();
    return lowerBound * Math.exp(Math.log(upperBound / lowerBound) * uniformRandom);
}
