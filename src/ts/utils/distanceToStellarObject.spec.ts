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

import { describe, expect, it } from "vitest";

import { Faction } from "../backend/society/factions";
import { getObjectModelById, StarSystemModel } from "../backend/universe/starSystemModel";
import { OrbitalObjectType } from "../frontend/architecture/orbitalObjectType";
import { Settings } from "../settings";
import { getDistancesToStellarObjects } from "./distanceToStellarObject";
import { DeepReadonly } from "./types";

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
                type: OrbitalObjectType.STAR,
                id: "star",
                name: "Star",
                orbit: {
                    p: 2,
                    semiMajorAxis: 0,
                    parentIds: [],
                    argumentOfPeriapsis: 0,
                    inclination: 0,
                    initialMeanAnomaly: 0,
                    longitudeOfAscendingNode: 0,
                    eccentricity: 0,
                },
                axialTilt: 0,
                seed: 0,
                siderealDaySeconds: 0,
                radius: Settings.SOLAR_RADIUS,
                mass: Settings.SOLAR_MASS,
                rings: null,
                blackBodyTemperature: 5778,
            },
        ],
        planets: [
            {
                type: OrbitalObjectType.GAS_PLANET,
                id: "planet",
                name: "Planet",
                orbit: {
                    p: 2,
                    semiMajorAxis: Settings.AU,
                    parentIds: ["star"],
                    argumentOfPeriapsis: 0,
                    inclination: 0,
                    initialMeanAnomaly: 0,
                    longitudeOfAscendingNode: 0,
                    eccentricity: 0,
                },
                axialTilt: 0,
                seed: 0,
                siderealDaySeconds: 0,
                radius: Settings.EARTH_RADIUS * 10,
                mass: Settings.EARTH_MASS * 10000,
                rings: null,
                atmosphere: {
                    greenHouseEffectFactor: 1,
                    pressure: 1,
                },
            },
        ],
        satellites: [],
        anomalies: [],
        orbitalFacilities: [
            {
                type: OrbitalObjectType.SPACE_STATION,
                id: "station",
                name: "Station",
                orbit: {
                    p: 2,
                    semiMajorAxis: Settings.EARTH_RADIUS * 30,
                    parentIds: ["planet"],
                    argumentOfPeriapsis: 0,
                    inclination: 0,
                    initialMeanAnomaly: 0,
                    longitudeOfAscendingNode: 0,
                    eccentricity: 0,
                },
                population: 1e6,
                populationDensity: 1e3,
                solarPanelEfficiency: 0.4,
                agricultureMix: [],
                seed: 0,
                siderealDaySeconds: 0,
                starSystemCoordinates: {
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    localX: 0,
                    localY: 0,
                    localZ: 0,
                },
                nbHydroponicLayers: 15,
                faction: Faction.SATORI_CONCORD,
                energyConsumptionPerCapitaKWh: 4000,
                mass: 1e6,
                axialTilt: 0,
            },
        ],
    };

    it("should be true", () => {
        const station = systemModel.orbitalFacilities[0];
        if (station === undefined) {
            throw new Error("Station is undefined");
        }
        const parentId = station.orbit.parentIds[0];
        if (parentId === undefined) {
            throw new Error("Parent ID is undefined");
        }
        const parent = getObjectModelById(parentId, systemModel);
        expect(parent).not.toBeNull();
        const distances = getDistancesToStellarObjects(station, systemModel);
        expect(distances.size).toBe(1);
        expect(distances.get(systemModel.stellarObjects[0])).toBe(parent?.orbit.semiMajorAxis);
    });
});
