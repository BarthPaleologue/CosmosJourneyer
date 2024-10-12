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

import { CelestialBodyModel, CelestialBodyType } from "../../architecture/celestialBody";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarPhysicalProperties } from "../../architecture/physicalProperties";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { seededSquirrelNoise } from "squirrel-noise";
import { getOrbitalPeriod, Orbit } from "../../orbit/orbit";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/math";
import { RingsModel } from "../../rings/ringsModel";
import { GenerationSteps } from "../../utils/generationSteps";
import i18n from "../../i18n";

export type NeutronStarModel = StellarObjectModel & {

    readonly bodyType: CelestialBodyType.NEUTRON_STAR;
    readonly temperature: number;

    readonly physicalProperties: StarPhysicalProperties;
}

export function newSeededNeutronStarModel(seed: number, name: string, parentBody: CelestialBodyModel | null): NeutronStarModel {
    const rng = seededSquirrelNoise(seed);

    const temperature = randRangeInt(200_000, 5_000_000_000, rng, GenerationSteps.TEMPERATURE);

    const physicalProperties: StarPhysicalProperties = {
        mass: 1000,
        rotationPeriod: 24 * 60 * 60,
        temperature: temperature,
        axialTilt: 0
    };

    const radius = clamp(normalRandom(10e3, 1e3, rng, GenerationSteps.RADIUS), 2e3, 50e3);

    // Todo: do not hardcode
    const orbitRadius = rng(GenerationSteps.ORBIT) * 5000000e3;

    const orbit: Orbit = {
        radius: orbitRadius,
        p: 2,
        period: getOrbitalPeriod(orbitRadius, parentBody?.physicalProperties.mass ?? 0),
        normalToPlane: Vector3.Up()
    };


    const ringProportion = 0.02;

    const rings = uniformRandBool(ringProportion, rng, GenerationSteps.RINGS) ? new RingsModel(rng) : null;

    const typeName = i18n.t("objectTypes:neutronStar");

    return {
        name: name,
        seed: seed,
        rng: rng,
        bodyType: CelestialBodyType.NEUTRON_STAR,
        physicalProperties: physicalProperties,
        temperature: temperature,
        parentBody: parentBody,
        radius: radius,
        orbit: orbit,
        rings: rings,
        typeName: typeName
    };
}
