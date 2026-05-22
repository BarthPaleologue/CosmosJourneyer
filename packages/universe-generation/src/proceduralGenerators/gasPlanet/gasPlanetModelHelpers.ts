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

import { astronomicalUnitToMeters, getWaterIceFrostLine, JupiterMass } from "@cosmos-journeyer/physics";

const GenerationSteps = {
    HOT_JUPITER_CHECK: 2564,
    ORBIT_RADIUS: 865,
    MASS: 3421,
} as const;

/**
 * Samples a plausible semi-major axis for a gas giant given the properties of its parent star.
 * @param stellarTemperature Temperature of the parent star in K
 * @param stellarRadius Radius of the parent star in meters
 * @param rng A random number generator function returning a uniform float in [0, 1)
 * @returns Semi-major axis in meters
 */
export function getGasPlanetOrbitRadius(
    stellarTemperature: number,
    stellarRadius: number,
    rng: (step: number) => number,
): number {
    const snowLine = getWaterIceFrostLine(stellarTemperature, stellarRadius);

    // Hot Jupiter modeling: around 1% chance (see https://academic.oup.com/mnras/article/516/1/75/6654884)
    const pHotJupiter = 0.01;
    if (rng(GenerationSteps.HOT_JUPITER_CHECK) < pHotJupiter) {
        // Keep clear of the star and also well interior to the snow line
        const aMin = Math.max(10 * stellarRadius, astronomicalUnitToMeters(0.02));
        const aMax = Math.min(astronomicalUnitToMeters(0.1), snowLine * 0.5);

        const upper = Math.max(aMax, aMin * 1.5);

        // Log-uniform inside this narrow inner region
        const u = rng(GenerationSteps.ORBIT_RADIUS);
        return aMin * Math.exp(Math.log(upper / aMin) * u);
    }

    const innerFactor = 1.3;
    const outerFactor = 3.0;

    const aMin = Math.max(snowLine * innerFactor, 10 * stellarRadius);
    let aMax = snowLine * outerFactor;
    if (aMax <= aMin) {
        aMax = aMin * 1.5;
    }

    const u = rng(GenerationSteps.ORBIT_RADIUS);
    const sqrtMin = Math.sqrt(aMin);
    const sqrtMax = Math.sqrt(aMax);
    const sqrtA = sqrtMin + (sqrtMax - sqrtMin) * u;
    return sqrtA * sqrtA;
}

export function sampleGasPlanetMass(rng: (step: number) => number): number {
    const minMass = 0.08 * JupiterMass;
    const maxMass = 8.0 * JupiterMass;

    const t = rng(GenerationSteps.MASS);
    const logMin = Math.log10(minMass);
    const logMax = Math.log10(maxMass);

    return 10 ** (logMin + (logMax - logMin) * t);
}
