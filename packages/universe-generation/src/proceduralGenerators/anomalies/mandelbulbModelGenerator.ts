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

import { DefaultAnomalyMass } from "#/constants";
import { hsvToRgb } from "#/utils/colors";
import { GenerationSteps } from "#/utils/generationSteps";
import { clamp } from "#/utils/math";
import { degreesToRadians, meters, radians, seconds } from "@cosmos-journeyer/physics";
import { getRngFromSeed, normalRandom, randRange } from "@cosmos-journeyer/random";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { MandelbulbModel, OrbitalObjectModel, Orbit, SpinModel } from "@cosmos-journeyer/universe-model";

/**
 * @param id Identifier assigned to the generated object.
 * @param seed Seed for reproducible procedural choices.
 * @param name Display name assigned to the generated object.
 * @param parentBodies Orbital ancestors that define the object's parent path.
 * @returns A seeded Mandelbulb model with orbital data.
 */
export function generateMandelbulbModel(
    id: string,
    seed: number,
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    parentBodies: DeepReadonly<Array<OrbitalObjectModel>>,
): MandelbulbModel {
    const rng = getRngFromSeed(seed);

    const radius = meters(1000e3);

    const power = randRange(7.0, 10.0, rng, GenerationSteps.POWER);
    const accentColor = hsvToRgb({
        h: 360 * rng(GenerationSteps.ACCENT_COLOR),
        s: rng(GenerationSteps.ACCENT_COLOR + 123) * 0.5,
        v: 0.8,
    });

    const orbitRadius = rng(GenerationSteps.ORBIT) * 15e9;

    const orbitalP = clamp(0.5, 3.0, normalRandom(1.0, 0.3, rng, GenerationSteps.ORBIT + 80));

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: meters(orbitRadius),
        p: orbitalP,
        plane: {
            inclination: degreesToRadians(normalRandom(90, 20, rng, GenerationSteps.ORBIT + 160)),
            longitudeOfAscendingNode: radians(randRange(0, 2 * Math.PI, rng, GenerationSteps.ORBIT + 320)),
        },
        eccentricity: randRange(0.1, 0.9, rng, GenerationSteps.ORBIT + 240),
        argumentOfPeriapsis: radians(randRange(0, 2 * Math.PI, rng, GenerationSteps.ORBIT + 400)),
        initialMeanAnomaly: radians(randRange(0, 2 * Math.PI, rng, GenerationSteps.ORBIT + 480)),
    };

    const mass = DefaultAnomalyMass;

    const spin: SpinModel = {
        siderealPeriod: seconds(0),
        axialTilt: radians(normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT)),
        axisAzimuth: radians(0),
        initialRotationAngle: radians(0),
    };

    return {
        type: "mandelbulb",
        id: id,
        name,
        radius,
        mass,
        spin,
        accentColor,
        power,
        orbit,
    };
}
