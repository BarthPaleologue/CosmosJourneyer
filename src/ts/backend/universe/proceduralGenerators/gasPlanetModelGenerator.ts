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

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Tools } from "@babylonjs/core/Misc/tools";
import { normalRandom, randRange, randRangeInt, uniformRandBool } from "extended-random";

import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { JupiterMass } from "@/utils/physics/constants";
import { DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { GasPlanetModel } from "../orbitalObjects/gasPlanetModel";
import { CelestialBodyModel } from "../orbitalObjects/index";
import { Orbit } from "../orbitalObjects/orbit";
import { OrbitalObjectType } from "../orbitalObjects/orbitalObjectType";
import { newSeededRingsModel } from "../orbitalObjects/ringsModel";

export function newSeededGasPlanetModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: DeepReadonly<Array<CelestialBodyModel>>,
): GasPlanetModel {
    const rng = getRngFromSeed(seed);

    const radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, rng, GenerationSteps.RADIUS);

    // Todo: do not hardcode
    let orbitRadius = rng(GenerationSteps.ORBIT) * 90e9;

    let parentAverageInclination = 0;
    let parentAverageAxialTilt = 0;
    if (parentBodies.length > 0) {
        const maxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);
        orbitRadius += maxRadius * 1.5;

        for (const parent of parentBodies) {
            parentAverageInclination += parent.orbit.inclination;
            parentAverageAxialTilt += parent.axialTilt;
        }
        parentAverageInclination /= parentBodies.length;
        parentAverageAxialTilt /= parentBodies.length;
    }

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination:
            parentAverageInclination +
            parentAverageAxialTilt +
            Tools.ToRadians(normalRandom(0, 5, rng, GenerationSteps.ORBIT + 10)),
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
    };
    const mass = JupiterMass * (radius / 69_911e3) ** 3;
    const axialTilt = normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT);
    const siderealDaySeconds = (24 * 60 * 60) / 10;

    const rings = uniformRandBool(0.8, rng, GenerationSteps.RINGS) ? newSeededRingsModel(radius, rng) : null;

    // color palette
    const hue1 = normalRandom(240, 30, rng, 70);
    const hue2 = normalRandom(0, 180, rng, 72);

    const divergence = -180;

    const color1 = Color3.FromHSV(hue1 % 360, randRange(0.4, 0.9, rng, 72), randRange(0.7, 0.9, rng, 73));
    const color2 = Color3.FromHSV(hue2 % 360, randRange(0.6, 0.9, rng, 74), randRange(0.0, 0.3, rng, 75));
    const color3 = Color3.FromHSV(
        (hue1 + divergence) % 360,
        randRange(0.4, 0.9, rng, 76),
        randRange(0.7, 0.9, rng, 77),
    );

    const colorSharpness = randRangeInt(40, 80, rng, 80) / 10;

    return {
        type: OrbitalObjectType.GAS_PLANET,
        id: id,
        name: name,
        seed: seed,
        radius: radius,
        orbit: orbit,
        siderealDaySeconds,
        axialTilt,
        mass,
        atmosphere: {
            seaLevelPressure: 100_000, // 1 bar
            greenHouseEffectFactor: 0.5,
            gasMix: [
                ["H2", 0.9],
                ["He", 0.1],
            ],
            aerosols: {
                tau550: 0.1,
                angstromExponent: 0.8,
                particleRadius: 1.5e-7,
                settlingCoefficient: 0.5,
            },
        },
        rings: rings,
        colorPalette: {
            type: "procedural",
            color1: color1,
            color2: color2,
            color3: color3,
            colorSharpness: colorSharpness,
        },
    };
}
