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

import { OrbitalObjectType } from "../../architecture/orbitalObject";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { normalRandom, randRangeInt } from "extended-random";
import { GenerationSteps } from "../../utils/generationSteps";
import { Settings } from "../../settings";
import { TelluricPlanetaryMassObjectPhysicsInfo } from "../../architecture/physicsInfo";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math";
import { clamp } from "terrain-generation";
import { getOrbitalPeriod, getPeriapsis, Orbit } from "../../orbit/orbit";
import { celsiusToKelvin, hasLiquidWater } from "../../utils/physics";
import { CloudsModel, newCloudsModel } from "../../clouds/cloudsModel";
import { TelluricPlanetaryMassObjectModel } from "./telluricPlanetaryMassObjectModel";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { randomDirection } from "../../utils/random";

export type TelluricSatelliteModel = TelluricPlanetaryMassObjectModel & {
    readonly type: OrbitalObjectType.TELLURIC_SATELLITE;
};

export function newSeededTelluricSatelliteModel(seed: number, name: string, parentBodies: CelestialBodyModel[]): TelluricSatelliteModel {
    const rng = getRngFromSeed(seed);

    const isSatelliteOfTelluric = parentBodies.some((parent) => parent.type === OrbitalObjectType.TELLURIC_PLANET);
    const isSatelliteOfGas = parentBodies.some((parent) => parent.type === OrbitalObjectType.GAS_PLANET);

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
        mass = Settings.MOON_MASS * (radius / 1_735e3) ** 3;
    } else {
        //FIXME: when Settings.Earth radius gets to 1:1 scale, change this value by a variable in settings
        mass = Settings.EARTH_MASS * (radius / 6_371e3) ** 3;
    }

    let pressure = Math.max(normalRandom(Settings.EARTH_SEA_LEVEL_PRESSURE, 0.2 * Settings.EARTH_SEA_LEVEL_PRESSURE, rng, GenerationSteps.PRESSURE), 0);
    if (isSatelliteOfTelluric || radius <= 0.3 * Settings.EARTH_RADIUS) {
        pressure = 0;
    }

    //TODO: use distance to star to determine min temperature when using 1:1 scale
    const minTemperature = Math.max(0, normalRandom(celsiusToKelvin(-20), 30, rng, 80));
    // when pressure is close to 1, the max temperature is close to the min temperature (the atmosphere does thermal regulation)
    const maxTemperature = minTemperature + Math.exp(-pressure / Settings.EARTH_SEA_LEVEL_PRESSURE) * randRangeInt(30, 200, rng, 81);

    // this average is an approximation of a quaternion average
    // see https://math.stackexchange.com/questions/61146/averaging-quaternions
    const parentAverageAxialTilt: Quaternion = parentBodies.reduce((sum, body) => sum.add(body.physics.axialTilt), Quaternion.Zero());
    parentAverageAxialTilt.scaleInPlace(1 / parentBodies.length);
    parentAverageAxialTilt.normalize();

    const physicalProperties: TelluricPlanetaryMassObjectPhysicsInfo = {
        mass: mass,
        axialTilt: parentAverageAxialTilt,
        siderealDayDuration: (60 * 60 * 24) / 10,
        minTemperature: minTemperature,
        maxTemperature: maxTemperature,
        pressure: pressure,
        waterAmount: Math.max(normalRandom(1.0, 0.3, rng, GenerationSteps.WATER_AMOUNT), 0),
        oceanLevel: 0
    };

    physicalProperties.oceanLevel = (Settings.OCEAN_DEPTH * physicalProperties.waterAmount * physicalProperties.pressure) / Settings.EARTH_SEA_LEVEL_PRESSURE;

    const orbitalP = 2;

    const parentMaxRadius = parentBodies.reduce((max, body) => Math.max(max, body.radius), 0);

    let orbitRadius = parentMaxRadius * clamp(normalRandom(2.0, 0.3, rng, GenerationSteps.ORBIT), 1.2, 3.0);
    orbitRadius += parentMaxRadius * clamp(normalRandom(10, 4, rng, GenerationSteps.ORBIT), 1, 50);
    orbitRadius += 2.0 * Math.max(0, parentMaxRadius - getPeriapsis(orbitRadius, orbitalP));

    const parentRotationAxis = Vector3.Up().applyRotationQuaternionInPlace(parentAverageAxialTilt);
    const orbitOrientation = parentAverageAxialTilt.clone();
    Quaternion.RotationAxis(parentRotationAxis, rng(GenerationSteps.ORBIT + 20) * 2 * Math.PI).multiplyToRef(orbitOrientation, orbitOrientation);
    Quaternion.RotationAxis(randomDirection(rng, GenerationSteps.ORBIT + 30), normalRandom(0, Math.PI / 12, rng, GenerationSteps.ORBIT + 10)).multiplyToRef(orbitOrientation, orbitOrientation);

    const parentMassSum = parentBodies.reduce((sum, body) => sum + body.physics.mass, 0);
    const orbit: Orbit = {
        radius: orbitRadius,
        p: orbitalP,
        period: getOrbitalPeriod(orbitRadius, parentMassSum),
        orientation: orbitOrientation
    };

    // tidal lock
    physicalProperties.siderealDayDuration = orbit.period;

    const canHaveLiquidWater = hasLiquidWater(physicalProperties.pressure, physicalProperties.minTemperature, physicalProperties.maxTemperature);
    if (!canHaveLiquidWater) physicalProperties.oceanLevel = 0;

    const clouds: CloudsModel | null =
        physicalProperties.oceanLevel > 0
            ? newCloudsModel(radius + physicalProperties.oceanLevel, Settings.CLOUD_LAYER_HEIGHT, physicalProperties.waterAmount, physicalProperties.pressure)
            : null;

    const terrainSettings = {
        continents_frequency: radius / Settings.EARTH_RADIUS,
        continents_fragmentation: physicalProperties.pressure > 0 ? clamp(normalRandom(0.65, 0.03, rng, GenerationSteps.TERRAIN), 0, 0.95) : 0,

        bumps_frequency: (30 * radius) / Settings.EARTH_RADIUS,

        max_bump_height: 1.5e3,
        max_mountain_height: 10e3,
        continent_base_height: 5e3 + physicalProperties.oceanLevel * 1.9,

        mountains_frequency: (60 * radius) / 1000e3
    };

    return {
        type: OrbitalObjectType.TELLURIC_SATELLITE,
        seed: seed,
        name,
        radius: radius,
        physics: physicalProperties,
        orbit: orbit,
        terrainSettings: terrainSettings,
        rings: null,
        clouds: clouds
    };
}
