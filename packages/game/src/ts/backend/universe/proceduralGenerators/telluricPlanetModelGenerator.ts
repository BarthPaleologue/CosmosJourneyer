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

import { normalRandom, uniformRandBool } from "extended-random";

import { type AtmosphereModel } from "@/backend/universe/orbitalObjects/atmosphereModel";
import { newCloudsModel, type CloudsModel } from "@/backend/universe/orbitalObjects/cloudsModel";
import { type StellarObjectModel } from "@/backend/universe/orbitalObjects/index";
import { type OceanModel } from "@/backend/universe/orbitalObjects/oceanModel";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { newSeededRingsModel, type RingsModel } from "@/backend/universe/orbitalObjects/ringsModel";
import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";

import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { clamp } from "@/utils/math";
import { EarthMass, EarthSeaLevelPressure } from "@/utils/physics/constants";
import { computeEffectiveTemperature, hasLiquidWater } from "@/utils/physics/physics";
import { degreesToRadians } from "@/utils/physics/unitConversions";
import type { DeepPartial, DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { getTelluricPlanetOrbitRadius } from "./telluricPlanetOrbitGenerator";
import { getTemperatureRange } from "./temperatureRange";

export function generateTelluricPlanetModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: DeepReadonly<Array<StellarObjectModel>>,
    overrides?: DeepPartial<TelluricPlanetModel>,
): TelluricPlanetModel {
    const rng = getRngFromSeed(seed);

    const radius = Math.max(0.1, normalRandom(1.0, 0.4, rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;

    //TODO: make mass dependent on more physical properties like density
    const mass = EarthMass * (radius / 6_371e3) ** 3;

    const orbitRadiuses: Array<number> = [];
    for (const parent of parentBodies) {
        const orbitRadius = getTelluricPlanetOrbitRadius(parent.blackBodyTemperature, parent.radius, parent.type, () =>
            rng(GenerationSteps.ORBIT + orbitRadiuses.length),
        );
        orbitRadiuses.push(orbitRadius);
    }

    const orbitRadius = overrides?.orbit?.semiMajorAxis ?? (parentBodies.length > 0 ? Math.max(...orbitRadiuses) : 0);

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

    let pressure = Math.max(normalRandom(0.8, 0.4, rng, GenerationSteps.PRESSURE) * EarthSeaLevelPressure, 0);
    if (radius <= 0.3 * Settings.EARTH_RADIUS) pressure = 0;

    const atmosphere: AtmosphereModel | null =
        pressure > 0
            ? {
                  pressure,
                  greenHouseEffectFactor: 0.5,
              }
            : null;

    const effectiveTemperature = computeEffectiveTemperature(
        parentBodies.map((body) => ({
            temperature: body.blackBodyTemperature,
            radius: body.radius,
            distance: orbit.semiMajorAxis,
        })),
        0.3,
    );

    const temperatureRange = getTemperatureRange(effectiveTemperature, 40, pressure);

    const axialTilt = normalRandom(0, 0.2, rng, GenerationSteps.AXIAL_TILT);
    const siderealDaySeconds = (60 * 60 * 24) / 10;
    const waterAmount = Math.max(normalRandom(1.0, 0.3, rng, GenerationSteps.WATER_AMOUNT), 0);

    const canHaveLiquidWater = hasLiquidWater(pressure, temperatureRange.min, temperatureRange.max);

    const ocean: OceanModel | null = canHaveLiquidWater
        ? {
              depth: (Settings.OCEAN_DEPTH * waterAmount * pressure) / EarthSeaLevelPressure,
          }
        : null;

    const clouds: CloudsModel | null =
        ocean !== null
            ? newCloudsModel(radius + ocean.depth, Settings.CLOUD_LAYER_HEIGHT, waterAmount, pressure)
            : null;

    const terrainSettings = {
        continents_frequency: radius / Settings.EARTH_RADIUS,
        continents_fragmentation: clamp(normalRandom(0.8, 0.1, rng, GenerationSteps.TERRAIN), 0, 0.95),

        bumps_frequency: (30 * radius) / Settings.EARTH_RADIUS,

        max_bump_height: 1.5e3,
        max_mountain_height: 10e3,
        continent_base_height: (ocean?.depth ?? 0) * 1.9,

        mountains_frequency: (60 * radius) / 1000e3,
    };
    if (pressure === 0) {
        terrainSettings.continents_fragmentation = 0;
    }
    if (ocean === null) {
        terrainSettings.continents_fragmentation /= 1.3;
    }

    const rings: RingsModel | null = uniformRandBool(0.6, rng, GenerationSteps.RINGS)
        ? newSeededRingsModel(radius, rng)
        : null;

    return {
        type: "telluricPlanet",
        id: id,
        seed: seed,
        name,
        mass,
        axialTilt,
        siderealDaySeconds,
        composition: {
            rock: 1 - waterAmount,
            h2o: waterAmount,
        },
        radius: radius,
        temperature: temperatureRange,
        orbit: orbit,
        terrainSettings: terrainSettings,
        rings: rings,
        clouds: clouds,
        ocean,
        atmosphere,
    };
}
