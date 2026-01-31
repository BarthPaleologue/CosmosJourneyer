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

import { Faction } from "@/backend/society/factions";
import { OrbitSchema } from "@/backend/universe/orbitalObjects/orbit";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";

import { CropType } from "@/utils/agriculture";
import { SolarMass, SolarRadius } from "@/utils/physics/constants";

export function getLoneStarSystem(): StarSystemModel {
    return {
        name: "Lone Star",
        coordinates: {
            starSectorX: 5,
            starSectorY: -10,
            starSectorZ: 8,
            localX: 0.5,
            localY: 0.2,
            localZ: 0.8,
        },
        stellarObjects: [
            {
                id: "loneStar",
                name: "Lone Star",
                type: "star",
                mass: SolarMass,
                radius: SolarRadius,
                blackBodyTemperature: 5778,
                axialTilt: 0,
                orbit: {
                    parentIds: [],
                    semiMajorAxis: 0,
                    eccentricity: 0,
                    inclination: 0,
                    longitudeOfAscendingNode: 0,
                    argumentOfPeriapsis: 0,
                    initialMeanAnomaly: 0,
                    p: 2,
                },
                rings: null,
                siderealDaySeconds: 0,
                seed: 0,
            },
        ],
        planets: [],
        satellites: [],
        anomalies: [],
        orbitalFacilities: [
            {
                id: "loneStarStation",
                name: "Lone Star Station",
                type: "spaceStation",
                mass: 1,
                agricultureMix: [[1, CropType.LENTIL]],
                population: 1e6,
                axialTilt: 0,
                orbit: OrbitSchema.parse({
                    parentIds: ["loneStar"],
                    semiMajorAxis: SolarRadius * 10,
                }),
                seed: 0,
                faction: Faction.SATORI_CONCORD,
                annualEnergyPerCapitaKWh: 1e3,
                solarPanelEfficiency: 0.4,
                siderealDaySeconds: 0,
                starSystemCoordinates: {
                    starSectorX: 5,
                    starSectorY: -10,
                    starSectorZ: 8,
                    localX: 0.5,
                    localY: 0.2,
                    localZ: 0.8,
                },
                populationDensity: 1e3,
                nbHydroponicLayers: 10,
            },
        ],
    };
}
