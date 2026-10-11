//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { degreesToRadians, getShadowRadius, solarMassToKg } from "@cosmos-journeyer/physics";
import type { StarSystemModel, BlackHoleModel, StarSystemCoordinates } from "@cosmos-journeyer/universe-model";

import type { SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

import { CropType } from "@/utils/agriculture";

import type { DarkKnightModel } from "../darkKnight/darkKnightModel";
import { DefaultOrbitalFacilityMass } from "../orbitalFacilities/constants";
import type { SpaceStationModel } from "../orbitalFacilities/spaceStationModel";

/** @returns The authored Chronos system. */
export function getChronosModel(): { systemModel: StarSystemModel; systemEntityModels: Array<SystemEntityModel> } {
    const coordinates: StarSystemCoordinates = {
        starSectorX: 0,
        starSectorY: 2,
        starSectorZ: -1,
        localX: 0.3,
        localY: -0.2,
        localZ: 0.4,
    };

    const chronosMass = solarMassToKg(40_000);
    const chronosShadowRadius = getShadowRadius(chronosMass);

    const chronos: BlackHoleModel = {
        type: "blackHole",
        id: "chronos",
        name: "Chronos",
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
        mass: chronosMass,
        blackBodyTemperature: 6000,
        accretionDiskRadius: chronosShadowRadius * 4,
        spin: {
            siderealPeriod: 1e-3,
            axialTilt: 0,
            axisAzimuth: 0,
            initialRotationAngle: 0,
        },
    };

    const chronosResearchLab: SystemEntityModel<SpaceStationModel> = {
        id: "chronosResearchLab",
        name: "Chronos Research Lab",
        content: {
            type: "spaceStation",
            solarPanelEfficiency: 0.5,
            agricultureMix: [[1, CropType.CASSAVA]],
            nbHydroponicLayers: 4,
            annualEnergyPerCapitaKWh: 2000,
            population: 500_000,
            populationDensity: 1,
            faction: "human_commonwealth",
            sections: [
                { type: "engineBay" },
                { type: "utility", hasTanks: true },
                { type: "cylinderHabitat", radius: 10e3, surface: { housing: 0.5, agriculture: 0.5 } },
                { type: "utility", hasTanks: true },
                { type: "fusion", netPowerOutput: 500_000 * 2000 * 10 },
                { type: "utility", hasTanks: true },
                { type: "landingBay", heightFactor: 2 },
            ],
        },
        placement: {
            type: "inOrbit",
            orbit: {
                parentIds: ["chronos"],
                semiMajorAxis: chronos.accretionDiskRadius * 4,
                eccentricity: 0,
                inclination: degreesToRadians(40),
                longitudeOfAscendingNode: degreesToRadians(120),
                argumentOfPeriapsis: 0,
                initialMeanAnomaly: Math.PI,
                p: 2,
            },
            mass: DefaultOrbitalFacilityMass,
            attitude: {
                spin: {
                    siderealPeriod: 0,
                    axialTilt: 0,
                    axisAzimuth: 0,
                    initialRotationAngle: 0,
                },
                localFrameOrientation: { yaw: 0, pitch: 0, roll: 0 },
            },
        },
    };

    const ananke: SystemEntityModel<DarkKnightModel> = {
        id: "ananke",
        name: "Ananke",
        content: {
            type: "darkKnight",
        },
        placement: {
            type: "inOrbit",
            mass: 1e15,
            orbit: {
                parentIds: ["chronos"],
                semiMajorAxis: chronos.accretionDiskRadius * 2,
                eccentricity: 0,
                inclination: degreesToRadians(70),
                longitudeOfAscendingNode: 0,
                argumentOfPeriapsis: 0,
                initialMeanAnomaly: 0,
                p: 2,
            },
            attitude: {
                spin: {
                    siderealPeriod: 0,
                    axialTilt: 0,
                    axisAzimuth: 0,
                    initialRotationAngle: 0,
                },
                localFrameOrientation: { yaw: 0, pitch: 0, roll: 0 },
            },
        },
    };

    const anankeOutpost: SystemEntityModel<SpaceStationModel> = {
        id: "anankeOutpost",
        name: "Ananke Outpost",
        content: {
            type: "spaceStation",
            solarPanelEfficiency: 0.5,
            agricultureMix: [[1, CropType.CASSAVA]],
            nbHydroponicLayers: 4,
            annualEnergyPerCapitaKWh: 2000,
            population: 200,
            populationDensity: 1,
            faction: "human_commonwealth",
            sections: [
                { type: "cylinderHabitat", radius: 5e3, surface: { housing: 0.5, agriculture: 0.1 } },
                { type: "utility", hasTanks: true },
                { type: "fusion", netPowerOutput: 2000 * 200 },
                { type: "utility", hasTanks: true },
                { type: "landingBay", heightFactor: 2 },
            ],
        },
        placement: {
            type: "inOrbit",
            orbit: {
                parentIds: ["ananke"],
                semiMajorAxis: 150e3,
                eccentricity: 0,
                inclination: 0,
                longitudeOfAscendingNode: 0,
                argumentOfPeriapsis: 0,
                initialMeanAnomaly: 0,
                p: 2,
            },
            mass: DefaultOrbitalFacilityMass,
            attitude: {
                spin: {
                    siderealPeriod: 0,
                    axialTilt: 0,
                    axisAzimuth: 0,
                    initialRotationAngle: 0,
                },
                localFrameOrientation: { yaw: 0, pitch: 0, roll: 0 },
            },
        },
    };

    const bigDream: SystemEntityModel<SpaceStationModel> = {
        id: "bigDream",
        name: "Big Dream",
        content: {
            type: "spaceStation",
            solarPanelEfficiency: 0.5,
            agricultureMix: [[1, CropType.CASSAVA]],
            nbHydroponicLayers: 4,
            annualEnergyPerCapitaKWh: 1000,
            population: 5_000_000,
            populationDensity: 1,
            faction: "dreamers_connection",
            sections: [
                { type: "cylinderHabitat", radius: 8e3, surface: { housing: 0.5, agriculture: 0.5 } },
                { type: "utility", hasTanks: true },
                { type: "fusion", netPowerOutput: 5_000_000 * 1000 },
                { type: "utility", hasTanks: true },
                { type: "landingBay", heightFactor: 2 },
            ],
        },
        placement: {
            type: "inOrbit",
            orbit: {
                parentIds: ["chronos"],
                semiMajorAxis: chronos.accretionDiskRadius * 6,
                eccentricity: 0,
                inclination: degreesToRadians(20),
                longitudeOfAscendingNode: degreesToRadians(240),
                argumentOfPeriapsis: 0,
                initialMeanAnomaly: Math.PI / 2,
                p: 2,
            },
            mass: DefaultOrbitalFacilityMass,
            attitude: {
                spin: {
                    siderealPeriod: 0,
                    axialTilt: 0,
                    axisAzimuth: 0,
                    initialRotationAngle: 0,
                },
                localFrameOrientation: { yaw: 0, pitch: 0, roll: 0 },
            },
        },
    };

    const zurvanInstance: SystemEntityModel<SpaceStationModel> = {
        id: "zurvanInstance",
        name: "Zurvan Instance",
        content: {
            type: "spaceStation",
            solarPanelEfficiency: 0.5,
            agricultureMix: [],
            nbHydroponicLayers: 4,
            annualEnergyPerCapitaKWh: 10_000,
            population: 50_000,
            populationDensity: 1,
            faction: "satori_concord",
            sections: [
                { type: "fusion", netPowerOutput: 50_000 * 10_000 },
                { type: "utility", hasTanks: true },
                { type: "landingBay", heightFactor: 2 },
            ],
        },
        placement: {
            type: "inOrbit",
            orbit: {
                parentIds: ["chronos"],
                semiMajorAxis: chronos.accretionDiskRadius * 4,
                eccentricity: 0,
                inclination: degreesToRadians(40),
                longitudeOfAscendingNode: degreesToRadians(120),
                argumentOfPeriapsis: 0,
                initialMeanAnomaly: 0,
                p: 2,
            },
            mass: DefaultOrbitalFacilityMass,
            attitude: {
                spin: {
                    siderealPeriod: 0,
                    axialTilt: 0,
                    axisAzimuth: 0,
                    initialRotationAngle: 0,
                },
                localFrameOrientation: { yaw: 0, pitch: 0, roll: 0 },
            },
        },
    };

    return {
        systemModel: {
            name: "Chronos",
            coordinates,
            stellarObjects: [chronos],
            planets: [],
            satellites: [],
            anomalies: [],
        },
        systemEntityModels: [ananke, chronosResearchLab, anankeOutpost, bigDream, zurvanInstance],
    };
}
