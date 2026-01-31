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

import { randRange, randRangeInt, uniformRandBool } from "extended-random";

import { type OrbitalObjectModel } from "@/backend/universe/orbitalObjects/index";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { newSeededRingsModel } from "@/backend/universe/orbitalObjects/ringsModel";
import { type StarModel } from "@/backend/universe/orbitalObjects/stellarObjects/starModel";

import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { SolarRadius } from "@/utils/physics/constants";
import type { StellarType } from "@/utils/physics/stellarTypes";
import { wheelOfFortune } from "@/utils/random";
import { assertUnreachable, type DeepReadonly } from "@/utils/types";

export function newSeededStarModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: DeepReadonly<Array<OrbitalObjectModel>>,
): StarModel {
    const rng = getRngFromSeed(seed);

    const RING_PROPORTION = 0.2;

    const stellarType = getRandomStellarType(rng);

    const temperature = getRandomTemperatureFromStellarType(stellarType, rng);
    const mass = 1.9885e30; //TODO: compute mass from physical properties
    const siderealDaySeconds = 24 * 60 * 60;
    const axialTilt = 0;

    const radius = getRandomRadiusFromStellarType(stellarType, rng);

    // TODO: do not hardcode
    const orbitRadius = rng(GenerationSteps.ORBIT) * 5000000e3;

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: parentBodies.length > 0 ? orbitRadius : 0,
        eccentricity: 0,
        p: 2,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
    };

    const rings = uniformRandBool(RING_PROPORTION, rng, GenerationSteps.RINGS)
        ? newSeededRingsModel(radius, rng)
        : null;

    return {
        type: "star",
        id: id,
        name: name,
        seed: seed,
        radius: radius,
        orbit: orbit,
        blackBodyTemperature: temperature,
        mass: mass,
        siderealDaySeconds: siderealDaySeconds,
        axialTilt: axialTilt,
        rings: rings,
    };
}

export function getRandomStellarType(rng: (step: number) => number): StellarType {
    return wheelOfFortune(
        [
            ["M", 0.765],
            ["K", 0.121],
            ["G", 0.076],
            ["F", 0.03],
            ["A", 0.006],
            ["B", 0.0013],
            ["O", 0.0000003],
        ] as const,
        rng(GenerationSteps.STELLAR_TYPE),
    );
}

export function getRandomTemperatureFromStellarType(stellarType: StellarType, rng: (step: number) => number) {
    switch (stellarType) {
        case "M":
            return randRangeInt(2100, 3400, rng, GenerationSteps.TEMPERATURE);
        case "K":
            return randRangeInt(3400, 4900, rng, GenerationSteps.TEMPERATURE);
        case "G":
            return randRangeInt(4900, 5700, rng, GenerationSteps.TEMPERATURE);
        case "F":
            return randRangeInt(5700, 7200, rng, GenerationSteps.TEMPERATURE);
        case "A":
            return randRangeInt(7200, 9700, rng, GenerationSteps.TEMPERATURE);
        case "B":
            return randRangeInt(9700, 30000, rng, GenerationSteps.TEMPERATURE);
        case "O":
            return randRangeInt(30000, 52000, rng, GenerationSteps.TEMPERATURE);
        default:
            return assertUnreachable(stellarType);
    }
}

export function getRandomRadiusFromStellarType(stellarType: StellarType, rng: (step: number) => number): number {
    switch (stellarType) {
        case "M":
            return randRange(0.5, 0.7, rng, GenerationSteps.RADIUS) * SolarRadius;
        case "K":
            return randRange(0.7, 0.9, rng, GenerationSteps.RADIUS) * SolarRadius;
        case "G":
            return randRange(0.9, 1.1, rng, GenerationSteps.RADIUS) * SolarRadius;
        case "F":
            return randRange(1.1, 1.4, rng, GenerationSteps.RADIUS) * SolarRadius;
        case "A":
            return randRange(1.4, 1.8, rng, GenerationSteps.RADIUS) * SolarRadius;
        case "B":
            return randRange(1.8, 6.6, rng, GenerationSteps.RADIUS) * SolarRadius;
        case "O":
            return randRange(6.6, 15.0, rng, GenerationSteps.RADIUS) * SolarRadius;
        default:
            return assertUnreachable(stellarType);
    }
}
