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

import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { Orbit } from "../../orbit/orbit";
import { PlanetaryMassObjectPhysicsInfo } from "../../architecture/physicsInfo";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { newSeededRingsModel } from "../../rings/ringsModel";
import { GenerationSteps } from "../../utils/generationSteps";
import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { OrbitalObjectType } from "../../architecture/orbitalObject";
import { PlanetModel } from "../../architecture/planet";

export type GasPlanetModel = PlanetModel & {
    readonly type: OrbitalObjectType.GAS_PLANET;
};

export function newSeededGasPlanetModel(
    seed: number,
    name: string,
    parentBodies: CelestialBodyModel[]
): GasPlanetModel {
    const rng = getRngFromSeed(seed);

    const radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, rng, GenerationSteps.RADIUS);

    // Todo: do not hardcode
    let orbitRadius = rng(GenerationSteps.ORBIT) * 15e9;

    if (parentBodies.length > 0) {
        const maxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);
        orbitRadius += maxRadius * 1.5;
    }

    const orbit: Orbit = {
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination: 0,
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0
    };

    const physicalProperties: PlanetaryMassObjectPhysicsInfo = {
        //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
        mass: Settings.JUPITER_MASS * (radius / 69_911e3) ** 3,
        axialTilt: normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT),
        siderealDaySeconds: (24 * 60 * 60) / 10,
        minTemperature: -180,
        maxTemperature: 200,
        //FIXME: this is a placeholder value
        pressure: Settings.EARTH_SEA_LEVEL_PRESSURE
    };

    const rings = uniformRandBool(0.8, rng, GenerationSteps.RINGS) ? newSeededRingsModel(rng) : null;

    return {
        name: name,
        seed: seed,
        type: OrbitalObjectType.GAS_PLANET,
        radius: radius,
        orbit: orbit,
        physics: physicalProperties,
        rings: rings
    };
}
