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

import { Orbit } from "../../orbit/orbit";
import { normalRandom, randRange, randRangeInt, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/math";
import { newSeededRingsModel } from "../../rings/ringsModel";
import { GenerationSteps } from "../../utils/generationSteps";
import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { OrbitalObjectModel } from "../../architecture/orbitalObjectModel";
import { NeutronStarModel } from "./neutronStarModel";
import { OrbitalObjectType } from "../../architecture/orbitalObjectType";

export function newSeededNeutronStarModel(
    seed: number,
    name: string,
    parentBodies: OrbitalObjectModel[]
): NeutronStarModel {
    const rng = getRngFromSeed(seed);

    const temperature = randRangeInt(200_000, 5_000_000_000, rng, GenerationSteps.TEMPERATURE);
    const mass = 1000;
    const siderealDaySeconds = 24 * 60 * 60;
    const blackBodyTemperature = temperature;
    const axialTilt = 0;

    const radius = clamp(normalRandom(10e3, 1e3, rng, GenerationSteps.RADIUS), 2e3, 50e3);

    const dipoleTilt = randRange(-Math.PI / 3, Math.PI / 3, rng, GenerationSteps.DIPOLE_TILT);

    // Todo: do not hardcode
    const orbitRadius = rng(GenerationSteps.ORBIT) * 5000000e3;

    const orbit: Orbit = {
        semiMajorAxis: parentBodies.length > 0 ? orbitRadius : 0,
        eccentricity: 0,
        p: 2,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0
    };

    const ringProportion = 0.02;

    const rings = uniformRandBool(ringProportion, rng, GenerationSteps.RINGS) ? newSeededRingsModel(rng) : null;

    return {
        type: OrbitalObjectType.NEUTRON_STAR,
        name,
        seed,
        blackBodyTemperature,
        dipoleTilt,
        mass,
        siderealDaySeconds,
        axialTilt,
        radius,
        orbit,
        rings
    };
}
