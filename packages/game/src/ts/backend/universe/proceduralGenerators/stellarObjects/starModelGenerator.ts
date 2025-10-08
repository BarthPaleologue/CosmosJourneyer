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
import { wheelOfFortune } from "@/utils/random";

import { Settings } from "@/settings";

export function newSeededStarModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: OrbitalObjectModel[],
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

export const enum StellarType {
    /** 30,000 - 50,000 K */
    O = "O",
    /** 10,000 - 30,000 K */
    B = "B",
    /** 7,500 - 10,000 K */
    A = "A",
    /** 6,000 - 7,500 K */
    F = "F",
    /** 5,000 - 6,000 K */
    G = "G",
    /** 3,500 - 5,000 K */
    K = "K",
    /** 2,700 - 3,500 K */
    M = "M",
}

export function getStellarTypeFromTemperature(temperature: number) {
    if (temperature < 3500) return StellarType.M;
    else if (temperature < 5000) return StellarType.K;
    else if (temperature < 6000) return StellarType.G;
    else if (temperature < 7500) return StellarType.F;
    else if (temperature < 10000) return StellarType.A;
    else if (temperature < 30000) return StellarType.B;
    else return StellarType.O;
}

export function getRandomStellarType(rng: (step: number) => number) {
    // use wheel of fortune
    const wheel: [StellarType, number][] = [
        [StellarType.M, 0.765],
        [StellarType.K, 0.121],
        [StellarType.G, 0.076],
        [StellarType.F, 0.03],
        [StellarType.A, 0.006],
        [StellarType.B, 0.0013],
        [StellarType.O, 0.0000003],
    ];

    const r = rng(GenerationSteps.STELLAR_TYPE);

    return wheelOfFortune<StellarType>(wheel, r);
}

export function getRandomTemperatureFromStellarType(stellarType: StellarType, rng: (step: number) => number) {
    switch (stellarType) {
        case StellarType.M:
            return randRangeInt(2100, 3400, rng, GenerationSteps.TEMPERATURE);
        case StellarType.K:
            return randRangeInt(3400, 4900, rng, GenerationSteps.TEMPERATURE);
        case StellarType.G:
            return randRangeInt(4900, 5700, rng, GenerationSteps.TEMPERATURE);
        case StellarType.F:
            return randRangeInt(5700, 7200, rng, GenerationSteps.TEMPERATURE);
        case StellarType.A:
            return randRangeInt(7200, 9700, rng, GenerationSteps.TEMPERATURE);
        case StellarType.B:
            return randRangeInt(9700, 30000, rng, GenerationSteps.TEMPERATURE);
        case StellarType.O:
            return randRangeInt(30000, 52000, rng, GenerationSteps.TEMPERATURE);
    }
}

export function getRandomRadiusFromStellarType(stellarType: StellarType, rng: (step: number) => number) {
    const solarSize = 109 * Settings.EARTH_RADIUS;
    switch (stellarType) {
        case StellarType.M:
            return randRange(0.5, 0.7, rng, GenerationSteps.RADIUS) * solarSize;
        case StellarType.K:
            return randRange(0.7, 0.9, rng, GenerationSteps.RADIUS) * solarSize;
        case StellarType.G:
            return randRange(0.9, 1.1, rng, GenerationSteps.RADIUS) * solarSize;
        case StellarType.F:
            return randRange(1.1, 1.4, rng, GenerationSteps.RADIUS) * solarSize;
        case StellarType.A:
            return randRange(1.4, 1.8, rng, GenerationSteps.RADIUS) * solarSize;
        case StellarType.B:
            return randRange(1.8, 6.6, rng, GenerationSteps.RADIUS) * solarSize;
        case StellarType.O:
            return randRange(6.6, 15.0, rng, GenerationSteps.RADIUS) * solarSize;
    }
}
