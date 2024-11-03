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

import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { GenerationSteps } from "../../utils/generationSteps";
import { Settings } from "../../settings";
import { celsiusToKelvin, getCurrentUniverseYear, getTidalLockingTimescale, hasLiquidWater } from "../../utils/physics";
import { CloudsModel, newCloudsModel } from "../../clouds/cloudsModel";
import { getOrbitalPeriod, Orbit } from "../../orbit/orbit";
import { newSeededRingsModel, RingsModel } from "../../rings/ringsModel";
import { clamp } from "../../utils/math";
import { Tools } from "@babylonjs/core/Misc/tools";
import { TelluricPlanetModel } from "./telluricPlanetModel";
import { StellarObjectModel } from "../../architecture/orbitalObjectModel";
import { OrbitalObjectType } from "../../architecture/orbitalObjectType";
import { OceanModel } from "../../ocean/oceanModel";
import { AtmosphereModel } from "../../atmosphere/atmosphereModel";
import { Lerp } from "@babylonjs/core/Maths/math.scalar.functions";

export function newSeededTelluricPlanetModel(
    seed: number,
    name: string,
    parentBodies: StellarObjectModel[]
): TelluricPlanetModel {
    const rng = getRngFromSeed(seed);

    const radius = Math.max(0.3, normalRandom(1.0, 0.1, rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;

    //TODO: make mass dependent on more physical properties like density
    const mass = Settings.EARTH_MASS * (radius / 6_371e3) ** 3;

    let pressure = Math.max(
        normalRandom(
            Settings.EARTH_SEA_LEVEL_PRESSURE,
            0.2 * Settings.EARTH_SEA_LEVEL_PRESSURE,
            rng,
            GenerationSteps.PRESSURE
        ),
        0
    );
    if (radius <= 0.3 * Settings.EARTH_RADIUS) pressure = 0;

    const atmosphere: AtmosphereModel | null =
        pressure > 0
            ? {
                  pressure,
                  greenHouseEffectFactor: 0.5
              }
            : null;

    //TODO: use distance to star to determine min temperature when using 1:1 scale
    const minTemperature = Math.max(0, normalRandom(celsiusToKelvin(-20), 30, rng, 80));
    // when pressure is close to 1, the max temperature is close to the min temperature (the atmosphere does thermal regulation)
    const maxTemperature =
        minTemperature + Math.exp(-pressure / Settings.EARTH_SEA_LEVEL_PRESSURE) * randRangeInt(30, 200, rng, 81);

    const axialTilt = normalRandom(0, 0.2, rng, GenerationSteps.AXIAL_TILT);

    const parentMassSum = parentBodies.reduce((sum, body) => sum + body.mass, 0);

    const waterAmount = Math.max(normalRandom(1.0, 0.3, rng, GenerationSteps.WATER_AMOUNT), 0);

    const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);

    const ocean: OceanModel | null = canHaveLiquidWater
        ? {
              depth: (Settings.OCEAN_DEPTH * waterAmount * pressure) / Settings.EARTH_SEA_LEVEL_PRESSURE
          }
        : null;

    const clouds: CloudsModel | null =
        ocean !== null
            ? newCloudsModel(radius + ocean.depth, Settings.CLOUD_LAYER_HEIGHT, waterAmount, pressure)
            : null;

    const parentMaxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);
    // Todo: do not hardcode
    const orbitRadius = 2e9 + rng(GenerationSteps.ORBIT) * 15e9 + parentMaxRadius * 1.5;

    let parentAverageInclination = 0;
    let parentAverageAxialTilt = 0;
    for (const parent of parentBodies) {
        parentAverageInclination += parent.orbit.inclination;
        parentAverageAxialTilt += parent.axialTilt;
    }
    parentAverageInclination /= parentBodies.length;
    parentAverageAxialTilt /= parentBodies.length;

    const orbit: Orbit = {
        semiMajorAxis: orbitRadius,
        p: 2,
        inclination:
            parentAverageInclination +
            parentAverageAxialTilt +
            Tools.ToRadians(normalRandom(0, 5, rng, GenerationSteps.ORBIT + 10)),
        eccentricity: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0
    };

    const terrainSettings = {
        continents_frequency: radius / Settings.EARTH_RADIUS,
        continents_fragmentation: clamp(normalRandom(0.65, 0.03, rng, GenerationSteps.TERRAIN), 0, 0.95),

        bumps_frequency: (30 * radius) / Settings.EARTH_RADIUS,

        max_bump_height: 1.5e3,
        max_mountain_height: 10e3,
        continent_base_height: (ocean?.depth ?? 0) * 1.9,

        mountains_frequency: (60 * radius) / 1000e3
    };

    const tidalLockingTimescale = getTidalLockingTimescale(parentMassSum, mass, orbitRadius, radius, 0);

    const parentMaxBirthYear = parentBodies.reduce((max, body) => Math.max(max, body.birthYear), 0);
    const currentAge = getCurrentUniverseYear() - parentMaxBirthYear;

    const tidalLockingFactor = Math.min(1, currentAge / tidalLockingTimescale);

    const orbitalPeriod = getOrbitalPeriod(orbit.semiMajorAxis, parentMassSum);

    const siderealDaySeconds = Lerp(60 * 60 * 24, orbitalPeriod, tidalLockingFactor);

    const rings: RingsModel | null = uniformRandBool(0.6, rng, GenerationSteps.RINGS) ? newSeededRingsModel(rng) : null;

    return {
        type: OrbitalObjectType.TELLURIC_PLANET,
        seed: seed,
        name,
        mass,
        axialTilt,
        siderealDaySeconds,
        waterAmount,
        radius: radius,
        temperature: {
            min: minTemperature,
            max: maxTemperature
        },
        orbit: orbit,
        terrainSettings: terrainSettings,
        rings: rings,
        clouds: clouds,
        ocean,
        atmosphere
    };
}
