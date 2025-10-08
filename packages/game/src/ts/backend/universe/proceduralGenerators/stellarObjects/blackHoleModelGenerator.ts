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

import { normalRandom } from "extended-random";

import { type CelestialBodyModel } from "@/backend/universe/orbitalObjects/index";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { type BlackHoleModel } from "@/backend/universe/orbitalObjects/stellarObjects/blackHoleModel";

import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { getMassFromSchwarzschildRadius } from "@/utils/physics/blackHole";
import { type DeepReadonly } from "@/utils/types";

export function newSeededBlackHoleModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: DeepReadonly<Array<CelestialBodyModel>>,
): BlackHoleModel {
    const rng = getRngFromSeed(seed);

    //FIXME: do not hardcode
    const radius = 1000e3;

    const parentMaxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);

    // TODO: do not hardcode
    const orbitRadius = parentBodies.length === 0 ? 0 : 2 * (parentMaxRadius + radius);

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

    const blackHoleMass = getMassFromSchwarzschildRadius(radius);
    const blackHoleSiderealDaySeconds = 1.5e-19;
    const blackHoleAxialTilt = normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT);
    const blackHoleAccretionDiskRadius = radius * normalRandom(12, 3, rng, 7777);
    const blackHoleBlackBodyTemperature = 7_000;

    return {
        type: "blackHole",
        id: id,
        name,
        radius,
        mass: blackHoleMass,
        blackBodyTemperature: blackHoleBlackBodyTemperature,
        siderealDaySeconds: blackHoleSiderealDaySeconds,
        axialTilt: blackHoleAxialTilt,
        accretionDiskRadius: blackHoleAccretionDiskRadius,
        orbit,
    };
}
