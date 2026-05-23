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

import { CloudLayerHeight, ScaledEarthRadius } from "#/constants";
import { GenerationSteps } from "#/utils/generationSteps";
import { getRngFromSeed } from "#/utils/getRngFromSeed";
import { clamp } from "#/utils/math";
import {
    computeEffectiveTemperature,
    degreesToRadians,
    EarthMass,
    EarthSeaLevelPressure,
    getOceanDepth,
    getOrbitalPeriod,
    hasLiquidWater,
    MoonMass,
} from "@cosmos-journeyer/physics";
import type { DeepReadonly, NonEmptyArray } from "@cosmos-journeyer/typescript";
import {
    type AtmosphereModel,
    type CloudsModel,
    type PlanetModel,
    type StellarObjectModel,
    type OceanModel,
    type Orbit,
    type TelluricSatelliteModel,
} from "@cosmos-journeyer/universe-model";
import { normalRandom } from "extended-random";

import { generateCloudsModel } from "./cloudsModelGenerator";
import { getTemperatureRange } from "./temperatureRange";

export function generateTelluricSatelliteModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: DeepReadonly<NonEmptyArray<PlanetModel>>,
    stellarObjects: DeepReadonly<Array<StellarObjectModel>>,
): TelluricSatelliteModel {
    const rng = getRngFromSeed(seed);

    const isSatelliteOfTelluric = parentBodies.some((parent) => parent.type === "telluricPlanet");
    const isSatelliteOfGas = parentBodies.some((parent) => parent.type === "gasPlanet");

    let radius: number;
    if (isSatelliteOfTelluric) {
        radius = Math.max(0.03, normalRandom(0.06, 0.03, rng, GenerationSteps.RADIUS)) * ScaledEarthRadius;
    } else if (isSatelliteOfGas) {
        radius = Math.max(0.03, normalRandom(0.25, 0.15, rng, GenerationSteps.RADIUS)) * ScaledEarthRadius;
    } else {
        throw new Error("Satellite is not around telluric or gas planet. Something is missing!");
    }

    //TODO: make mass dependent on more physical properties like density
    let mass;
    if (isSatelliteOfTelluric) {
        //FIXME: when scaled Earth radius gets to 1:1 scale, change this value by a localized constant
        mass = MoonMass * (radius / 1_735e3) ** 3;
    } else {
        //FIXME: when scaled Earth radius gets to 1:1 scale, change this value by a localized constant
        mass = EarthMass * (radius / 6_371e3) ** 3;
    }

    let pressure = Math.max(
        normalRandom(EarthSeaLevelPressure, 0.2 * EarthSeaLevelPressure, rng, GenerationSteps.PRESSURE),
        0,
    );
    if (isSatelliteOfTelluric || radius <= 0.3 * ScaledEarthRadius) {
        pressure = 0;
    }

    const stellarParents: Array<{ stellarObject: DeepReadonly<StellarObjectModel>; distance: number }> = [];
    for (const stellarObject of stellarObjects) {
        let averageSemiMajorAxis = 0;
        let count = 0;
        for (const parent of parentBodies) {
            if (parent.orbit.parentIds.includes(stellarObject.id)) {
                averageSemiMajorAxis += parent.orbit.semiMajorAxis;
                count++;
            }
        }
        if (count > 0) {
            stellarParents.push({ stellarObject, distance: averageSemiMajorAxis / count });
        }
    }

    const effectiveTemperature = computeEffectiveTemperature(
        stellarParents.map(({ stellarObject, distance }) => ({
            temperature: stellarObject.blackBodyTemperature,
            radius: stellarObject.radius,
            distance: distance,
        })),
        0.3,
    );

    const temperatureRange = getTemperatureRange(effectiveTemperature, 40, pressure);

    const axialTilt = 0;
    const waterAmount = clamp(normalRandom(0.5, 0.1, rng, GenerationSteps.WATER_AMOUNT), 0, 1);

    const atmosphere: AtmosphereModel | null =
        pressure > 0
            ? {
                  pressure: pressure,
                  greenHouseEffectFactor: 0.5,
              }
            : null;

    const canHaveLiquidWater = hasLiquidWater(pressure, temperatureRange.min, temperatureRange.max);

    let oceanCoverage = clamp(normalRandom(0.8, 0.1, rng, GenerationSteps.TERRAIN), 0.1, 0.95);
    if (pressure === 0) {
        oceanCoverage = 0.0;
    }

    const ocean: OceanModel | null = canHaveLiquidWater
        ? {
              depth: getOceanDepth(radius, mass, waterAmount, oceanCoverage),
          }
        : null;

    if (ocean === null) {
        oceanCoverage /= 1.3;
    }

    const parentMaxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);

    let orbitRadius = parentMaxRadius * clamp(normalRandom(2.0, 0.3, rng, GenerationSteps.ORBIT), 1.2, 3.0);
    orbitRadius += parentMaxRadius * clamp(normalRandom(10, 4, rng, GenerationSteps.ORBIT), 1, 50);
    orbitRadius += 2.0 * parentMaxRadius;

    const parentMassSum = parentBodies.reduce((sum, body) => sum + body.mass, 0);

    let parentAverageInclination = 0;
    let parentAverageAxialTilt = 0;
    for (const parent of parentBodies) {
        parentAverageInclination += parent.orbit.inclination;
        parentAverageAxialTilt += parent.axialTilt;
    }
    parentAverageInclination /= parentBodies.length;
    parentAverageAxialTilt /= parentBodies.length;

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination:
            parentAverageInclination +
            parentAverageAxialTilt +
            degreesToRadians(normalRandom(0, 5, rng, GenerationSteps.ORBIT + 10)),
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
    };

    const siderealDaySeconds = getOrbitalPeriod(orbit.semiMajorAxis, parentMassSum);

    const averageTemperature = (temperatureRange.min + temperatureRange.max) / 2;
    const clouds: CloudsModel | null =
        ocean !== null
            ? generateCloudsModel(radius + ocean.depth, CloudLayerHeight, oceanCoverage, averageTemperature, pressure)
            : null;

    const terrainSettings = {
        continents_frequency: radius / ScaledEarthRadius,
        continents_fragmentation: oceanCoverage,
        bumps_frequency: (30 * radius) / ScaledEarthRadius,

        max_bump_height: 1.5e3,
        max_mountain_height: 10e3,
        continent_base_height: 5e3 + (ocean?.depth ?? 0),

        mountains_frequency: (60 * radius) / 1000e3,
    };

    return {
        type: "telluricSatellite",
        id: id,
        seed: seed,
        name,
        mass,
        radius: radius,
        axialTilt: axialTilt,
        siderealDaySeconds: siderealDaySeconds,
        composition: {
            rock: 1 - waterAmount,
            h2o: waterAmount,
        },
        orbit: orbit,
        terrainSettings: terrainSettings,
        temperature: temperatureRange,
        atmosphere: atmosphere,
        ocean: ocean,
        clouds: clouds,
    };
}
