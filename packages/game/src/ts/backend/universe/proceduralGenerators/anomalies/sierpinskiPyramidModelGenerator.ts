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

import { normalRandom, randRange } from "extended-random";

import { type SierpinskiPyramidModel } from "@/backend/universe/orbitalObjects/anomalies/sierpinskiPyramidModel";
import { type OrbitalObjectModel } from "@/backend/universe/orbitalObjects/index";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

import { hsvToRgb } from "@/utils/colors";
import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { clamp } from "@/utils/math";
import { degreesToRadians } from "@/utils/physics/unitConversions";

export function newSeededSierpinskiPyramidModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: ReadonlyArray<OrbitalObjectModel>,
): SierpinskiPyramidModel {
    const rng = getRngFromSeed(seed);

    const radius = 200e3;

    const accentColor = hsvToRgb({
        h: 360 * rng(GenerationSteps.ACCENT_COLOR),
        s: rng(GenerationSteps.ACCENT_COLOR + 123) * 0.5,
        v: 0.8,
    });

    // Todo: do not hardcode
    const orbitRadius = rng(GenerationSteps.ORBIT) * 15e9;

    const orbitalP = clamp(0.5, 3.0, normalRandom(1.0, 0.3, rng, GenerationSteps.ORBIT + 80));

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: orbitRadius,
        p: orbitalP,
        inclination: degreesToRadians(normalRandom(90, 20, rng, GenerationSteps.ORBIT + 160)),
        eccentricity: randRange(0.1, 0.9, rng, GenerationSteps.ORBIT + 240),
        longitudeOfAscendingNode: randRange(0, 2 * Math.PI, rng, GenerationSteps.ORBIT + 320),
        argumentOfPeriapsis: randRange(0, 2 * Math.PI, rng, GenerationSteps.ORBIT + 400),
        initialMeanAnomaly: randRange(0, 2 * Math.PI, rng, GenerationSteps.ORBIT + 480),
    };

    const mass = 10;
    const siderealDaySeconds = 0;
    const axialTilt = normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT);

    return {
        type: OrbitalObjectType.SIERPINSKI_PYRAMID,
        id: id,
        name,
        radius,
        accentColor,
        orbit,
        mass,
        siderealDaySeconds,
        axialTilt,
    };
}
