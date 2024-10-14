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

import { CelestialBodyModel } from "../../architecture/celestialBody";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StellarObjectPhysicalProperties } from "../../architecture/physicalProperties";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { getOrbitalPeriod, Orbit } from "../../orbit/orbit";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/math";
import { newSeededRingsModel } from "../../rings/ringsModel";
import { GenerationSteps } from "../../utils/generationSteps";

import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { OrbitalObjectType } from "../../architecture/orbitalObject";

export type NeutronStarModel = StellarObjectModel & {
    readonly type: OrbitalObjectType.NEUTRON_STAR;
};

export function newSeededNeutronStarModel(seed: number, name: string, parentBodies: CelestialBodyModel[]): NeutronStarModel {
    const rng = getRngFromSeed(seed);

    const temperature = randRangeInt(200_000, 5_000_000_000, rng, GenerationSteps.TEMPERATURE);

    const physicalProperties: StellarObjectPhysicalProperties = {
        mass: 1000,
        rotationPeriod: 24 * 60 * 60,
        temperature: temperature,
        axialTilt: 0
    };

    const radius = clamp(normalRandom(10e3, 1e3, rng, GenerationSteps.RADIUS), 2e3, 50e3);

    // Todo: do not hardcode
    const orbitRadius = rng(GenerationSteps.ORBIT) * 5000000e3;

    const parentMassSum = parentBodies?.reduce((sum, body) => sum + body.physics.mass, 0) ?? 0;
    const orbit: Orbit = {
        radius: orbitRadius,
        p: 2,
        period: getOrbitalPeriod(orbitRadius, parentMassSum),
        normalToPlane: Vector3.Up()
    };

    const ringProportion = 0.02;

    const rings = uniformRandBool(ringProportion, rng, GenerationSteps.RINGS) ? newSeededRingsModel(rng) : null;

    return {
        name: name,
        seed: seed,
        type: OrbitalObjectType.NEUTRON_STAR,
        physics: physicalProperties,
        radius: radius,
        orbit: orbit,
        rings: rings
    };
}
