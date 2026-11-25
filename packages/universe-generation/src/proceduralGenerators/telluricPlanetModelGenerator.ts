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
import { clamp } from "#/utils/math";
import {
    computeEffectiveTemperature,
    degreesToRadians,
    EarthMass,
    EarthSeaLevelPressure,
    getOceanDepth,
    hasLiquidWater,
    kelvin,
    kilograms,
    meters,
    pascals,
    radians,
    seconds,
} from "@cosmos-journeyer/physics";
import { getRngFromSeed, normalRandom, uniformRandBool } from "@cosmos-journeyer/random";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { getCelestialBodyRadius } from "@cosmos-journeyer/universe-model";
import type {
    AtmosphereModel,
    CloudsModel,
    OceanModel,
    Orbit,
    RingsModel,
    SpinModel,
    StellarObjectModel,
    TelluricPlanetModel,
} from "@cosmos-journeyer/universe-model";

import { generateCloudsModel } from "./cloudsModelGenerator";
import { generateSeededRingsModel } from "./ringsModelGenerator";
import { generateTelluricMagneticFieldModel } from "./telluricMagneticFieldModelGenerator";
import { getTelluricPlanetOrbitRadius } from "./telluricPlanetOrbitGenerator";
import { getTemperatureRange } from "./temperatureRange";

/**
 * Generates a telluric planet model with seeded properties and parent-relative orbital data.
 * @param id Identifier assigned to the generated planet.
 * @param seed Seed used to make procedural choices reproducible.
 * @param name Display name assigned to the planet.
 * @param parentBodies Stellar objects that parent the planet's orbit.
 * @returns The generated telluric planet model.
 */
export function generateTelluricPlanetModel(
    id: string,
    seed: number,
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    parentBodies: DeepReadonly<Array<StellarObjectModel>>,
): TelluricPlanetModel {
    const rng = getRngFromSeed(seed);

    const radius = Math.max(0.1, normalRandom(1.0, 0.4, rng, GenerationSteps.RADIUS)) * ScaledEarthRadius;

    const mass = EarthMass * (radius / 6_371e3) ** 3;

    const orbitRadiuses: Array<number> = [];
    for (const parent of parentBodies) {
        const orbitRadius = getTelluricPlanetOrbitRadius(
            parent.blackBodyTemperature,
            getCelestialBodyRadius(parent),
            () => rng(GenerationSteps.ORBIT + orbitRadiuses.length),
        );
        orbitRadiuses.push(orbitRadius);
    }

    const orbitRadius = parentBodies.length > 0 ? Math.max(...orbitRadiuses) : 0;

    let parentAverageInclination = 0;
    let parentAverageAxialTilt = 0;
    for (const parent of parentBodies) {
        parentAverageInclination += parent.orbit.plane.inclination;
        parentAverageAxialTilt += parent.spin.axialTilt;
    }
    parentAverageInclination /= parentBodies.length;
    parentAverageAxialTilt /= parentBodies.length;

    const parentIds = parentBodies.map((body) => body.id);

    const orbit: Orbit = {
        parentIds: parentIds,
        semiMajorAxis: meters(orbitRadius),
        p: 2,
        plane: {
            inclination: radians(
                parentAverageInclination +
                    parentAverageAxialTilt +
                    degreesToRadians(normalRandom(0, 5, rng, GenerationSteps.ORBIT + 10)),
            ),
            longitudeOfAscendingNode: radians(0),
        },
        eccentricity: 0,
        argumentOfPeriapsis: radians(0),
        initialMeanAnomaly: radians(0),
    };

    let pressure = Math.max(normalRandom(0.8, 0.4, rng, GenerationSteps.PRESSURE) * EarthSeaLevelPressure, 0);
    if (radius <= 0.3 * ScaledEarthRadius) {
        pressure = 0;
    }

    const atmosphere: AtmosphereModel | null =
        pressure > 0
            ? {
                  pressure,
                  greenHouseEffectFactor: 0.5,
              }
            : null;

    const effectiveTemperature = computeEffectiveTemperature(
        parentBodies.map((body) => ({
            temperature: kelvin(body.blackBodyTemperature),
            radius: meters(getCelestialBodyRadius(body)),
            distance: meters(orbit.semiMajorAxis),
        })),
        0.3,
    );

    const temperatureRange = getTemperatureRange(effectiveTemperature, 40, pressure);

    const spin: SpinModel = {
        siderealPeriod: seconds((60 * 60 * 24) / 10),
        axialTilt: radians(normalRandom(0, 0.2, rng, GenerationSteps.AXIAL_TILT)),
        axisAzimuth: radians(0),
        initialRotationAngle: radians(0),
    };

    const waterAmount = clamp(normalRandom(0.02, 0.01, rng, GenerationSteps.WATER_AMOUNT), 0, 0.2);
    const canHaveLiquidWater = hasLiquidWater(
        pascals(pressure),
        kelvin(temperatureRange.min),
        kelvin(temperatureRange.max),
    );

    let oceanCoverage = clamp(normalRandom(0.8, 0.1, rng, GenerationSteps.TERRAIN), 0.1, 0.95);
    if (pressure === 0) {
        oceanCoverage = 0.0;
    }

    const ocean: OceanModel | null = canHaveLiquidWater
        ? {
              depth: getOceanDepth(meters(radius), kilograms(mass), waterAmount, oceanCoverage),
          }
        : null;

    if (ocean === null) {
        oceanCoverage /= 1.3;
    }

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
        continent_base_height: ocean !== null ? ocean.depth : 0,

        mountains_frequency: (60 * radius) / ScaledEarthRadius,
    };

    const rings: RingsModel | null = uniformRandBool(0.01, rng, GenerationSteps.RINGS)
        ? generateSeededRingsModel(radius, rng)
        : null;

    return {
        type: "telluricPlanet",
        id,
        seed,
        name,
        mass,
        spin,
        composition: {
            rock: 1 - waterAmount,
            h2o: waterAmount,
        },
        radius,
        temperature: temperatureRange,
        orbit,
        terrainSettings,
        rings,
        clouds,
        ocean,
        atmosphere,
        magneticField: generateTelluricMagneticFieldModel(radius, 0.5, rng),
    };
}
