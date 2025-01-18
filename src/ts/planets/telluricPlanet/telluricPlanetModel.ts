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

import { PlanetModel } from "../../architecture/planet";
import { OrbitalObjectType } from "../../architecture/orbitalObject";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { GenerationSteps } from "../../utils/generationSteps";
import { Settings } from "../../settings";
import { TelluricPlanetaryMassObjectPhysicsInfo } from "../../architecture/physicsInfo";
import { celsiusToKelvin, hasLiquidWater } from "../../utils/physics";
import { CloudsModel, newCloudsModel } from "../../clouds/cloudsModel";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { getOrbitalPeriod, Orbit } from "../../orbit/orbit";
import { clamp } from "terrain-generation";
import { newSeededRingsModel, RingsModel } from "../../rings/ringsModel";
import { TelluricPlanetaryMassObjectModel } from "./telluricPlanetaryMassObjectModel";

export type TelluricPlanetModel = PlanetModel &
    TelluricPlanetaryMassObjectModel & {
        readonly type: OrbitalObjectType.TELLURIC_PLANET;
    };

export function newSeededTelluricPlanetModel(seed: number, name: string, parentBodies: CelestialBodyModel[]): TelluricPlanetModel {
    const rng = getRngFromSeed(seed);

    const radius = Math.max(0.3, normalRandom(1.0, 0.1, rng, GenerationSteps.RADIUS)) * Settings.EARTH_RADIUS;

    //TODO: make mass dependent on more physical properties like density
    const mass = Settings.EARTH_MASS * (radius / 6_371e3) ** 3;

    let pressure = Math.max(normalRandom(Settings.EARTH_SEA_LEVEL_PRESSURE, 0.2 * Settings.EARTH_SEA_LEVEL_PRESSURE, rng, GenerationSteps.PRESSURE), 0);
    if (radius <= 0.3 * Settings.EARTH_RADIUS) pressure = 0;

    //TODO: use distance to star to determine min temperature when using 1:1 scale
    const minTemperature = Math.max(0, normalRandom(celsiusToKelvin(-20), 30, rng, 80));
    // when pressure is close to 1, the max temperature is close to the min temperature (the atmosphere does thermal regulation)
    const maxTemperature = minTemperature + Math.exp(-pressure / Settings.EARTH_SEA_LEVEL_PRESSURE) * randRangeInt(30, 200, rng, 81);

    const physicalProperties: TelluricPlanetaryMassObjectPhysicsInfo = {
        mass: mass,
        axialTilt: Quaternion.RotationAxis(Axis.X, normalRandom(0, 0.2, rng, GenerationSteps.AXIAL_TILT)),
        siderealDaySeconds: (60 * 60 * 24) / 10,
        minTemperature: minTemperature,
        maxTemperature: maxTemperature,
        pressure: pressure,
        waterAmount: Math.max(normalRandom(1.0, 0.3, rng, GenerationSteps.WATER_AMOUNT), 0),
        oceanLevel: 0
    };

    physicalProperties.oceanLevel = (Settings.OCEAN_DEPTH * physicalProperties.waterAmount * physicalProperties.pressure) / Settings.EARTH_SEA_LEVEL_PRESSURE;

    const canHaveLiquidWater = hasLiquidWater(physicalProperties.pressure, physicalProperties.minTemperature, physicalProperties.maxTemperature);
    if (!canHaveLiquidWater) physicalProperties.oceanLevel = 0;

    let clouds: CloudsModel | null = null;
    if (physicalProperties.oceanLevel > 0) {
        clouds = newCloudsModel(radius + physicalProperties.oceanLevel, Settings.CLOUD_LAYER_HEIGHT, physicalProperties.waterAmount, physicalProperties.pressure);
    }

    const parentMaxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);
    // Todo: do not hardcode
    const orbitRadius = 2e9 + rng(GenerationSteps.ORBIT) * 15e9 + parentMaxRadius * 1.5;

    const orbitalP = 2; //clamp(normalRandom(2.0, 0.3, this.rng, GenerationSteps.Orbit + 80), 0.7, 3.0);

    const parentMassSum = parentBodies.reduce((sum, body) => sum + body.physics.mass, 0);
    const orbit: Orbit = {
        radius: orbitRadius,
        p: orbitalP,
        period: getOrbitalPeriod(orbitRadius, parentMassSum),
        orientation: Quaternion.RotationAxis(Axis.X, (rng(GenerationSteps.ORBIT + 20) - 0.5) * 0.2)
    };

    const terrainSettings = {
        continents_frequency: radius / Settings.EARTH_RADIUS,
        continents_fragmentation: clamp(normalRandom(0.65, 0.03, rng, GenerationSteps.TERRAIN), 0, 0.95),

        bumps_frequency: (30 * radius) / Settings.EARTH_RADIUS,

        max_bump_height: 1.5e3,
        max_mountain_height: 10e3,
        continent_base_height: physicalProperties.oceanLevel * 1.9,

        mountains_frequency: (60 * radius) / 1000e3
    };

    const rings: RingsModel | null = uniformRandBool(0.6, rng, GenerationSteps.RINGS) ? newSeededRingsModel(rng) : null;

    return {
        type: OrbitalObjectType.TELLURIC_PLANET,
        seed: seed,
        name,
        radius: radius,
        physics: physicalProperties,
        orbit: orbit,
        terrainSettings: terrainSettings,
        rings: rings,
        clouds: clouds
    };
}
