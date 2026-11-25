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

import { GenerationSteps } from "#/utils/generationSteps";
import { getMassFromSchwarzschildRadius, meters, radians, seconds } from "@cosmos-journeyer/physics";
import { getRngFromSeed, normalRandom } from "@cosmos-journeyer/random";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { getCelestialBodyRadius } from "@cosmos-journeyer/universe-model";
import type { CelestialBodyModel, Orbit, BlackHoleModel, SpinModel } from "@cosmos-journeyer/universe-model";

/**
 * @param id Identifier assigned to the generated object.
 * @param seed Seed for reproducible procedural choices.
 * @param name Display name assigned to the generated object.
 * @param parentBodies Orbital ancestors that define the object's parent path.
 * @returns A black hole model with seeded physical and orbital properties.
 */
export function generateBlackHoleModel(
    id: string,
    seed: number,
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    parentBodies: DeepReadonly<Array<CelestialBodyModel>>,
): BlackHoleModel {
    const rng = getRngFromSeed(seed);

    const schwarzschildRadius = 1000e3;

    const parentMaxRadius = parentBodies.reduce((max, body) => Math.max(max, getCelestialBodyRadius(body)), 0);

    const orbitRadius = parentBodies.length === 0 ? 0 : 2 * (parentMaxRadius + schwarzschildRadius);

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

    const blackHoleMass = getMassFromSchwarzschildRadius(meters(schwarzschildRadius));

    const spin: SpinModel = {
        siderealPeriod: seconds(1.5e-19),
        axialTilt: radians(normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT)),
        axisAzimuth: radians(0),
        initialRotationAngle: radians(0),
    };

    const blackHoleAccretionDiskRadius = schwarzschildRadius * normalRandom(12, 3, rng, 7777);
    const blackHoleBlackBodyTemperature = 7_000;

    return {
        type: "blackHole",
        id,
        name,
        mass: blackHoleMass,
        blackBodyTemperature: blackHoleBlackBodyTemperature,
        spin,
        accretionDiskRadius: blackHoleAccretionDiskRadius,
        orbit,
    };
}
