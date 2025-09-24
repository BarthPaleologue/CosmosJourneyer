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

import { normalRandom, randRange, randRangeInt, uniformRandBool } from "extended-random";

import { type OrbitalObjectModel } from "@/backend/universe/orbitalObjects/index";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { newSeededRingsModel } from "@/backend/universe/orbitalObjects/ringsModel";
import { type NeutronStarModel } from "@/backend/universe/orbitalObjects/stellarObjects/neutronStarModel";

import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { clamp } from "@/utils/math";

/**
 * Creates a new pseudo-random neutron star model
 * @param seed The seed to use for the pseudo-random number generator
 * @param name The name of the neutron star
 * @param parentBodies The parent bodies of the neutron star (an empty array if it is the primary body of the system)
 * @returns A new neutron star model
 * @see https://arxiv.org/pdf/2402.14030 "On the initial spin period distribution of neutron stars"
 */
export function newSeededNeutronStarModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: OrbitalObjectModel[],
): NeutronStarModel {
    const rng = getRngFromSeed(seed);

    const mass = 1.9885e30; //TODO: compute mass from physical properties

    // https://arxiv.org/pdf/2402.14030 and https://en.wikipedia.org/wiki/Neutron_star#:~:text=Because%20it%20has%20only%20a,1.4%20ms%20to%2030%20s.
    const siderealDaySeconds = clamp(1.4e-3, 30, normalRandom(0.5e-2, 5e-3, rng, GenerationSteps.SIDEREAL_DAY_SECONDS));

    const blackBodyTemperature = randRangeInt(200_000, 5_000_000_000, rng, GenerationSteps.TEMPERATURE);
    const axialTilt = 0;

    const radius = clamp(normalRandom(10e3, 1e3, rng, GenerationSteps.RADIUS), 2e3, 50e3);

    const dipoleTilt = randRange(-Math.PI / 6, Math.PI / 6, rng, GenerationSteps.DIPOLE_TILT);

    // Todo: do not hardcode
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

    const ringProportion = 0.02;

    const rings = uniformRandBool(ringProportion, rng, GenerationSteps.RINGS) ? newSeededRingsModel(radius, rng) : null;

    return {
        type: OrbitalObjectType.NEUTRON_STAR,
        id: id,
        name,
        seed,
        blackBodyTemperature,
        dipoleTilt,
        mass,
        siderealDaySeconds,
        axialTilt,
        radius,
        orbit,
        rings,
    };
}
