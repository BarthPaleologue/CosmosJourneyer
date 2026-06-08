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
import { getRngFromSeed } from "#/utils/getRngFromSeed";
import { getMassFromSchwarzschildRadius } from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import {
    getCelestialBodyRadius,
    type CelestialBodyModel,
    type Orbit,
    type BlackHoleModel,
    type Rotation,
} from "@cosmos-journeyer/universe-model";
import { normalRandom } from "extended-random";

export function generateBlackHoleModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: DeepReadonly<Array<CelestialBodyModel>>,
): BlackHoleModel {
    const rng = getRngFromSeed(seed);

    //FIXME: do not hardcode
    const schwarzschildRadius = 1000e3;

    const parentMaxRadius = parentBodies.reduce((max, body) => Math.max(max, getCelestialBodyRadius(body)), 0);

    // TODO: do not hardcode
    const orbitRadius = parentBodies.length === 0 ? 0 : 2 * (parentMaxRadius + schwarzschildRadius);

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

    const blackHoleMass = getMassFromSchwarzschildRadius(schwarzschildRadius);

    const rotation: Rotation = {
        siderealPeriod: 1.5e-19,
        axialTilt: normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT),
        spinAxisAzimuth: 0,
        initialRotationAngle: 0,
    };

    const blackHoleAccretionDiskRadius = schwarzschildRadius * normalRandom(12, 3, rng, 7777);
    const blackHoleBlackBodyTemperature = 7_000;

    return {
        type: "blackHole",
        id,
        name,
        mass: blackHoleMass,
        blackBodyTemperature: blackHoleBlackBodyTemperature,
        rotation,
        accretionDiskRadius: blackHoleAccretionDiskRadius,
        orbit,
    };
}
