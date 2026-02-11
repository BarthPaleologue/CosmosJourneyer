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

import { normalRandom, randRangeInt } from "extended-random";

import { type AtmosphereModel } from "@/backend/universe/orbitalObjects/atmosphereModel";
import { newCloudsModel, type CloudsModel } from "@/backend/universe/orbitalObjects/cloudsModel";
import { type PlanetModel } from "@/backend/universe/orbitalObjects/index";
import { type OceanModel } from "@/backend/universe/orbitalObjects/oceanModel";
import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";
import { type TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";

import { GenerationSteps } from "@/utils/generationSteps";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { clamp } from "@/utils/math";
import { EarthMass, EarthSeaLevelPressure, MoonMass } from "@/utils/physics/constants";
import { getOrbitalPeriod } from "@/utils/physics/orbit";
import { hasLiquidWater } from "@/utils/physics/physics";
import { celsiusToKelvin, degreesToRadians } from "@/utils/physics/unitConversions";

import { Settings } from "@/settings";

export function generateTelluricSatelliteModel(
    id: string,
    seed: number,
    name: string,
    parentBodies: PlanetModel[],
): TelluricSatelliteModel {
    const rng = getRngFromSeed(seed);

    const isSatelliteOfTelluric = parentBodies.some((parent) => parent.type === "telluricPlanet");
    const isSatelliteOfGas = parentBodies.some((parent) => parent.type === "gasPlanet");

    let radius: number;
    if (isSatelliteOfTelluric) {
        radius = Math.max(0.03, normalRandom(0.06, 0.03, rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
    } else if (isSatelliteOfGas) {
        radius = Math.max(0.03, normalRandom(0.25, 0.15, rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;
    } else {
        throw new Error("Satellite is not around telluric or gas planet. Something is missing!");
    }

    //TODO: make mass dependent on more physical properties like density
    let mass;
    if (isSatelliteOfTelluric) {
        //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
        mass = MoonMass * (radius / 1_735e3) ** 3;
    } else {
        //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
        mass = EarthMass * (radius / 6_371e3) ** 3;
    }

    let pressure = Math.max(
        normalRandom(EarthSeaLevelPressure, 0.2 * EarthSeaLevelPressure, rng, GenerationSteps.PRESSURE),
        0,
    );
    if (isSatelliteOfTelluric || radius <= 0.3 * Settings.EARTH_RADIUS) {
        pressure = 0;
    }

    //TODO: use distance to star to determine min temperature when using 1:1 scale
    const minTemperature = Math.max(0, normalRandom(celsiusToKelvin(-20), 30, rng, 80));
    // when pressure is close to 1, the max temperature is close to the min temperature (the atmosphere does thermal regulation)
    const maxTemperature =
        minTemperature + Math.exp(-pressure / EarthSeaLevelPressure) * randRangeInt(30, 200, rng, 81);

    const axialTilt = 0;
    let siderealDaySeconds = (60 * 60 * 24) / 10;
    const waterAmount = Math.max(normalRandom(1.0, 0.3, rng, GenerationSteps.WATER_AMOUNT), 0);

    const atmosphere: AtmosphereModel | null =
        pressure > 0
            ? {
                  pressure: pressure,
                  greenHouseEffectFactor: 0.5,
              }
            : null;

    const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);

    const ocean: OceanModel | null = canHaveLiquidWater
        ? {
              depth: (Settings.OCEAN_DEPTH * waterAmount * pressure) / EarthSeaLevelPressure,
          }
        : null;

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

    // tidal lock
    siderealDaySeconds = getOrbitalPeriod(orbit.semiMajorAxis, parentMassSum);

    const clouds: CloudsModel | null =
        ocean !== null
            ? newCloudsModel(radius + ocean.depth, Settings.CLOUD_LAYER_HEIGHT, waterAmount, pressure)
            : null;

    const terrainSettings = {
        continents_frequency: radius / Settings.EARTH_RADIUS,
        continents_fragmentation:
            pressure > 0 ? clamp(normalRandom(0.65, 0.03, rng, GenerationSteps.TERRAIN), 0, 0.95) : 0,

        bumps_frequency: (30 * radius) / Settings.EARTH_RADIUS,

        max_bump_height: 1.5e3,
        max_mountain_height: 10e3,
        continent_base_height: 5e3 + 1.9 * (ocean?.depth ?? 0),

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
        waterAmount: waterAmount,
        orbit: orbit,
        terrainSettings: terrainSettings,
        temperature: {
            min: minTemperature,
            max: maxTemperature,
        },
        atmosphere: atmosphere,
        ocean: ocean,
        clouds: clouds,
    };
}
