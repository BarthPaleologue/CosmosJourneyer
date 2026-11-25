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

import { ScaledEarthRadius } from "#/constants";
import {
    astronomicalUnitToMeters,
    EarthMass,
    kilograms,
    meters,
    radians,
    seconds,
    SolarMass,
    SolarRadius,
} from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { StarSystemModel } from "@cosmos-journeyer/universe-model";
import { describe, expect, it } from "vitest";

import { getDistancesToStellarObjects } from "./distanceToStellarObject";

describe("distanceToStellarObject", () => {
    const systemModel: DeepReadonly<StarSystemModel> = {
        name: "Test System",
        coordinates: {
            starSectorX: 0,
            starSectorY: 0,
            starSectorZ: 0,
            localX: 0,
            localY: 0,
            localZ: 0,
        },
        stellarObjects: [
            {
                type: "star",
                id: "star",
                name: "Star",
                orbit: {
                    p: 2,
                    semiMajorAxis: meters(0),
                    parentIds: [],
                    argumentOfPeriapsis: radians(0),
                    plane: {
                        inclination: radians(0),
                        longitudeOfAscendingNode: radians(0),
                    },
                    initialMeanAnomaly: radians(0),
                    eccentricity: 0,
                },
                spin: {
                    siderealPeriod: seconds(0),
                    axialTilt: radians(0),
                    axisAzimuth: radians(0),
                    initialRotationAngle: radians(0),
                },
                seed: 0,
                radius: SolarRadius,
                mass: SolarMass,
                rings: null,
                blackBodyTemperature: 5778,
            },
        ],
        planets: [
            {
                type: "gasPlanet",
                id: "planet",
                name: "Planet",
                orbit: {
                    p: 2,
                    semiMajorAxis: astronomicalUnitToMeters(1),
                    parentIds: ["star"],
                    argumentOfPeriapsis: radians(0),
                    plane: {
                        inclination: radians(0),
                        longitudeOfAscendingNode: radians(0),
                    },
                    initialMeanAnomaly: radians(0),
                    eccentricity: 0,
                },
                spin: {
                    siderealPeriod: seconds(0),
                    axialTilt: radians(0),
                    axisAzimuth: radians(0),
                    initialRotationAngle: radians(0),
                },
                seed: 0,
                radius: ScaledEarthRadius * 10,
                mass: kilograms(EarthMass * 10000),
                rings: null,
                atmosphere: {
                    greenHouseEffectFactor: 1,
                    pressure: 1,
                },
                magneticField: {
                    north: { latitude: Math.PI / 2, longitude: 0 },
                    magnitude: 1e27,
                },
                colorPalette: {
                    type: "textured",
                    textureId: "jupiter",
                },
            },
        ],
        satellites: [],
        anomalies: [],
    };

    it("uses the stellar ancestor distance for an object orbiting a planet", () => {
        const planet = systemModel.planets[0];
        if (planet === undefined) {
            throw new Error("Planet is undefined");
        }
        const orbit = { ...planet.orbit, parentIds: [planet.id], semiMajorAxis: meters(ScaledEarthRadius * 30) };
        const distances = getDistancesToStellarObjects(orbit, systemModel);
        expect(distances.size).toBe(1);
        expect(distances.get(systemModel.stellarObjects[0])).toBe(planet.orbit.semiMajorAxis);
    });
});
