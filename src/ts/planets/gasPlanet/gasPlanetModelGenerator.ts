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

import { Tools } from "@babylonjs/core/Misc/tools";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";

import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";

import { CelestialBodyModel } from "../../architecture/orbitalObjectModel";
import { OrbitalObjectType } from "../../architecture/orbitalObjectType";
import { Orbit } from "../../orbit/orbit";
import { newSeededRingsModel } from "../../rings/ringsModel";
import { Settings } from "../../settings";
import { GasPlanetModel } from "./gasPlanetModel";

export function newSeededGasPlanetModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: CelestialBodyModel[]
): GasPlanetModel {
    const rng = getRngFromSeed(seed);

    const radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, rng, GenerationSteps.RADIUS);

    // Todo: do not hardcode
    let orbitRadius = rng(GenerationSteps.ORBIT) * 15e9;

    let parentAverageInclination = 0;
    let parentAverageAxialTilt = 0;
    if (parentBodies.length > 0) {
        const maxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);
        orbitRadius += maxRadius * 1.5;

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
            Tools.ToRadians(normalRandom(0, 5, rng, GenerationSteps.ORBIT + 10)),
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0
    };
    const mass = Settings.JUPITER_MASS * (radius / 69_911e3) ** 3;
    const axialTilt = normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT);
    const siderealDaySeconds = (24 * 60 * 60) / 10;

    const rings = uniformRandBool(0.8, rng, GenerationSteps.RINGS) ? newSeededRingsModel(rng) : null;

    return {
        type: OrbitalObjectType.GAS_PLANET,
        id: id,
        name: name,
        seed: seed,
        radius: radius,
        orbit: orbit,
        siderealDaySeconds,
        axialTilt,
        mass,
        atmosphere: {
            pressure: Settings.EARTH_SEA_LEVEL_PRESSURE,
            greenHouseEffectFactor: 0.5
        },
        rings: rings
    };
}
