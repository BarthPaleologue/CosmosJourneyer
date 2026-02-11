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

import { type StarSystemModel } from "@/backend/universe/starSystemModel";

import { SolarMass, SolarRadius } from "@/utils/physics/constants";

import { generateSpaceStationModel } from "../proceduralGenerators/orbitalFacilities/spaceStationModelGenerator";

export function getLoneStarSystem(): StarSystemModel {
    const systemModel: StarSystemModel = {
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
        orbitalFacilities: [],
    };

    const stationModel = generateSpaceStationModel("loneStarStation", 0, systemModel.stellarObjects[0], systemModel, {
        name: "Lone Star Outpost",
    });

    systemModel.orbitalFacilities.push(stationModel);

    return systemModel;
}
