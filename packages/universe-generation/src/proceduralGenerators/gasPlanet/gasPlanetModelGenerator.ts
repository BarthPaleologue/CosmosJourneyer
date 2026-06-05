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

import { generateSeededRingsModel } from "#/proceduralGenerators/ringsModelGenerator";
import { hsvToRgb } from "#/utils/colors";
import { GenerationSteps } from "#/utils/generationSteps";
import { getRngFromSeed } from "#/utils/getRngFromSeed";
import { degreesToRadians, EarthSeaLevelPressure, getCoolGasGiantRadiusFromMass } from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import {
    getCelestialBodyRadius,
    type GasPlanetModel,
    type Orbit,
    type StellarObjectModel,
} from "@cosmos-journeyer/universe-model";
import { normalRandom, randRange, randRangeInt, uniformRandBool } from "extended-random";

import { getGasPlanetOrbitRadius, sampleGasPlanetMass } from "./gasPlanetModelHelpers";

export function generateGasPlanetModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: DeepReadonly<Array<StellarObjectModel>>,
): GasPlanetModel {
    const rng = getRngFromSeed(seed);

    const mass = sampleGasPlanetMass(rng);

    const radius = getCoolGasGiantRadiusFromMass(mass);

    const orbitRadiuses: Array<number> = [];
    for (const parent of parentBodies) {
        const radius = getGasPlanetOrbitRadius(parent.blackBodyTemperature, getCelestialBodyRadius(parent), rng);
        orbitRadiuses.push(radius);
    }

    const orbitRadius = parentBodies.length > 0 ? Math.max(...orbitRadiuses) : 0;

    let parentAverageInclination = 0;
    let parentAverageAxialTilt = 0;
    if (parentBodies.length > 0) {
        for (const parent of parentBodies) {
            parentAverageInclination += parent.orbit.inclination;
            parentAverageAxialTilt += parent.axialTilt;
        }
        parentAverageInclination /= parentBodies.length;
        parentAverageAxialTilt /= parentBodies.length;
    }

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination:
            parentAverageInclination +
            parentAverageAxialTilt +
            degreesToRadians(normalRandom(0, 5, rng, GenerationSteps.ORBIT + 10)),
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
    };

    const axialTilt = normalRandom(0, degreesToRadians(25), rng, GenerationSteps.AXIAL_TILT);
    const siderealDaySeconds = (24 * 60 * 60) / 10;

    const rings = uniformRandBool(0.8, rng, GenerationSteps.RINGS) ? generateSeededRingsModel(radius, rng) : null;

    // color palette
    const hue1 = normalRandom(240, 30, rng, 70);
    const hue2 = normalRandom(0, 180, rng, 72);

    const divergence = -180;

    const color1 = hsvToRgb({ h: hue1 % 360, s: randRange(0.4, 0.9, rng, 72), v: randRange(0.7, 0.9, rng, 73) });
    const color2 = hsvToRgb({ h: hue2 % 360, s: randRange(0.6, 0.9, rng, 74), v: randRange(0.0, 0.3, rng, 75) });
    const color3 = hsvToRgb({
        h: (hue1 + divergence) % 360,
        s: randRange(0.4, 0.9, rng, 76),
        v: randRange(0.7, 0.9, rng, 77),
    });

    const colorSharpness = randRangeInt(40, 80, rng, 80) / 10;

    return {
        type: "gasPlanet",
        id: id,
        name: name,
        seed: seed,
        radius: radius,
        orbit: orbit,
        siderealDaySeconds,
        axialTilt,
        mass,
        atmosphere: {
            pressure: EarthSeaLevelPressure,
            greenHouseEffectFactor: 0.5,
        },
        rings: rings,
        colorPalette: {
            type: "procedural",
            color1: color1,
            color2: color2,
            color3: color3,
            colorSharpness: colorSharpness,
        },
    };
}
