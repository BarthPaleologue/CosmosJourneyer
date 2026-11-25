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
import { GenerationSteps } from "#/utils/generationSteps";
import { clamp } from "#/utils/math";
import { kilograms, radians, seconds, meters } from "@cosmos-journeyer/physics";
import { getRngFromSeed, normalRandom, randRange, randRangeInt, uniformRandBool } from "@cosmos-journeyer/random";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { OrbitalObjectModel, Orbit, NeutronStarModel, SpinModel } from "@cosmos-journeyer/universe-model";

/**
 * @param id Identifier assigned to the generated object.
 * @param seed Seed for reproducible procedural choices.
 * @param name Display name assigned to the neutron star.
 * @param parentBodies Orbital ancestors; empty when the star is primary.
 * @returns A neutron star model with seeded physical and orbital properties.
 * @see https://arxiv.org/pdf/2402.14030 "On the initial spin period distribution of neutron stars"
 */
export function generateNeutronStarModel(
    id: string,
    seed: number,
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    parentBodies: DeepReadonly<Array<OrbitalObjectModel>>,
): NeutronStarModel {
    const rng = getRngFromSeed(seed);

    const mass = kilograms(1.9885e30);

    const spin: SpinModel = {
        axialTilt: radians(0),
        axisAzimuth: radians(0),
        initialRotationAngle: radians(0),
        // https://arxiv.org/pdf/2402.14030 and https://en.wikipedia.org/wiki/Neutron_star#:~:text=Because%20it%20has%20only%20a,1.4%20ms%20to%2030%20s.
        siderealPeriod: seconds(
            clamp(normalRandom(0.5e-2, 5e-3, rng, GenerationSteps.SIDEREAL_DAY_SECONDS), 1.4e-3, 30),
        ),
    };

    const blackBodyTemperature = randRangeInt(200_000, 5_000_000, rng, GenerationSteps.TEMPERATURE);

    const radius = meters(clamp(normalRandom(10e3, 1e3, rng, GenerationSteps.RADIUS), 2e3, 50e3));

    const dipoleTilt = randRange(-Math.PI / 6, Math.PI / 6, rng, GenerationSteps.DIPOLE_TILT);

    const orbitRadius = rng(GenerationSteps.ORBIT) * 5000000e3;

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: meters(parentBodies.length > 0 ? orbitRadius : 0),
        eccentricity: 0,
        p: 2,
        plane: {
            inclination: radians(0),
            longitudeOfAscendingNode: radians(0),
        },
        argumentOfPeriapsis: radians(0),
        initialMeanAnomaly: radians(0),
    };

    const ringProportion = 0.02;

    const rings = uniformRandBool(ringProportion, rng, GenerationSteps.RINGS)
        ? generateSeededRingsModel(radius, rng)
        : null;

    return {
        type: "neutronStar",
        id,
        name,
        seed,
        blackBodyTemperature,
        dipoleTilt,
        mass,
        spin,
        radius,
        orbit,
        rings,
    };
}
