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

import {
    astronomicalUnitToMeters,
    barToPascal,
    celsiusToKelvin,
    degreesToRadians,
    durationToSeconds,
    EarthMass,
    EarthRadius,
    getOrbitalPeriod,
    getOrbitRadiusFromPeriod,
    getWaterIceFrostLine,
    JupiterMass,
    JupiterRadius,
    km2ToM2,
    SolarMass,
    SolarRadius,
    SolarTemperature,
} from "@cosmos-journeyer/physics";
import {
    type StarSystemModel,
    type StarSystemCoordinates,
    type StarModel,
    type GasPlanetModel,
    type TelluricPlanetModel,
    type SpaceStationModel,
    type TelluricSatelliteModel,
} from "@cosmos-journeyer/universe-model";

import { CropType } from "@/utils/agriculture";

export function getVestaSystemModel(): StarSystemModel {
    const coordinates: StarSystemCoordinates = {
        starSectorX: -1,
        starSectorY: 2,
        starSectorZ: 1,
        localX: -0.1,
        localY: 0.4,
        localZ: 0.1,
    };

    const vesta: StarModel = {
        type: "star",
        name: "Vesta",
        id: "vesta",
        blackBodyTemperature: SolarTemperature,
        radius: SolarRadius,
        mass: SolarMass,
        seed: 42,
        rotation: {
            axialTilt: 0,
            spinAxisAzimuth: 0,
            initialRotationAngle: 0,
            siderealPeriod: durationToSeconds({ days: 20, hours: 2, minutes: 5 }),
        },
        orbit: {
            semiMajorAxis: 0,
            eccentricity: 0,
            initialMeanAnomaly: 0,
            inclination: 0,
            longitudeOfAscendingNode: 0,
            parentIds: [],
            argumentOfPeriapsis: 0,
            p: 2,
        },
        rings: null,
    };

    const janusOrbitRadius = astronomicalUnitToMeters(0.2);
    const janusOrbitalPeriod = getOrbitalPeriod(janusOrbitRadius, vesta.mass);
    const janus: TelluricPlanetModel = {
        type: "telluricPlanet",
        name: "Janus",
        id: "janus",
        radius: EarthRadius * 0.1,
        mass: EarthMass * 0.1 ** 3,
        seed: 44,
        rotation: {
            axialTilt: degreesToRadians(5),
            spinAxisAzimuth: 0,
            initialRotationAngle: 0,
            siderealPeriod: janusOrbitalPeriod,
        },
        orbit: {
            parentIds: ["vesta"],
            semiMajorAxis: janusOrbitRadius,
            eccentricity: 0,
            inclination: degreesToRadians(8),
            longitudeOfAscendingNode: degreesToRadians(45),
            initialMeanAnomaly: degreesToRadians(256),
            argumentOfPeriapsis: degreesToRadians(54),
            p: 2,
        },
        rings: null,
        ocean: null,
        atmosphere: null,
        clouds: null,
        terrainSettings: {
            continents_fragmentation: 0,
            continent_base_height: 0,
            continents_frequency: 1.0,
            max_bump_height: 1e3,
            max_mountain_height: 10e3,
            mountains_frequency: 60,
            bumps_frequency: 30,
        },
        composition: {
            h2o: 0,
            rock: 1,
        },
        temperature: {
            min: 50,
            max: 400,
        },
    };

    const aphroditeRadius = EarthRadius * 0.2;
    const aphrodite = {
        type: "telluricPlanet",
        name: "Aphrodite",
        id: "aphrodite",
        radius: aphroditeRadius,
        mass: EarthMass * 0.2 ** 3,
        seed: 45,
        rotation: {
            axialTilt: degreesToRadians(10),
            spinAxisAzimuth: 0,
            initialRotationAngle: 0,
            siderealPeriod: durationToSeconds({ hours: 26, minutes: 21, seconds: 48 }),
        },
        orbit: {
            parentIds: ["vesta"],
            semiMajorAxis: astronomicalUnitToMeters(1),
            eccentricity: 0,
            inclination: degreesToRadians(2),
            longitudeOfAscendingNode: degreesToRadians(157),
            initialMeanAnomaly: degreesToRadians(32),
            argumentOfPeriapsis: 0,
            p: 2,
        },
        rings: {
            type: "procedural",
            iceAlbedo: { r: 0.93, g: 0.92, b: 0.9 },
            dustAlbedo: { r: 0.85, g: 0.7, b: 0.65 },
            seed: 0.65,
            frequency: 5,
            innerRadius: aphroditeRadius * 1.7,
            outerRadius: aphroditeRadius * 3.0,
        },
        ocean: {
            depth: 10e3,
        },
        atmosphere: {
            pressure: barToPascal(1.2),
            greenHouseEffectFactor: 1,
        },
        clouds: {
            color: { r: 0.9, g: 0.9, b: 0.9 },
            coverage: 0.4,
            layerRadius: aphroditeRadius + 20e3,
            smoothness: 0.7,
            specularPower: 2,
            frequency: 4,
            detailFrequency: 12,
            sharpness: 1,
            worleySpeed: 0.0005,
            detailSpeed: 0.003,
        },
        terrainSettings: {
            continents_fragmentation: 0.9,
            continent_base_height: 10e3,
            continents_frequency: 1.0,
            max_bump_height: 1e3,
            max_mountain_height: 10e3,
            mountains_frequency: 60,
            bumps_frequency: 30,
        },
        composition: {
            h2o: 0.01,
            rock: 0.99,
        },
        temperature: {
            min: celsiusToKelvin(-10),
            max: celsiusToKelvin(40),
        },
    } satisfies TelluricPlanetModel;

    const adonisOrbitRadius = aphrodite.rings.outerRadius * 2;
    const adonis = {
        type: "telluricSatellite",
        name: "Adonis",
        id: "adonis",
        radius: EarthRadius * 0.02,
        mass: EarthMass * 0.02 ** 3,
        seed: 74,
        orbit: {
            parentIds: ["aphrodite"],
            semiMajorAxis: adonisOrbitRadius,
            eccentricity: 0,
            inclination: degreesToRadians(-4),
            initialMeanAnomaly: degreesToRadians(248),
            argumentOfPeriapsis: degreesToRadians(21),
            p: 2,
            longitudeOfAscendingNode: degreesToRadians(175),
        },
        rotation: {
            axialTilt: degreesToRadians(0.2),
            spinAxisAzimuth: degreesToRadians(22),
            siderealPeriod: getOrbitalPeriod(adonisOrbitRadius, aphrodite.mass),
            initialRotationAngle: degreesToRadians(18),
        },
        terrainSettings: {
            continents_fragmentation: 0.0,
            continent_base_height: 0,
            continents_frequency: 0.2,
            max_bump_height: 1e3,
            max_mountain_height: 2e3,
            mountains_frequency: 60 * 0.2,
            bumps_frequency: 30 * 0.2,
        },
        clouds: null,
        atmosphere: null,
        ocean: null,
        composition: {
            h2o: 0.01,
            rock: 0.99,
        },
        temperature: {
            min: 50,
            max: 350,
        },
    } satisfies TelluricSatelliteModel;

    const phileasOrbitRadius = getOrbitRadiusFromPeriod(durationToSeconds({ days: 80 }), aphrodite.mass);
    const phileas = {
        type: "telluricSatellite",
        name: "Phileas",
        id: "phileas",
        radius: EarthRadius * 0.1,
        mass: EarthMass * 0.1 ** 3,
        seed: 62,
        orbit: {
            parentIds: ["aphrodite"],
            semiMajorAxis: phileasOrbitRadius,
            eccentricity: 0,
            inclination: degreesToRadians(1),
            initialMeanAnomaly: degreesToRadians(23),
            argumentOfPeriapsis: degreesToRadians(76),
            p: 2,
            longitudeOfAscendingNode: degreesToRadians(15),
        },
        rotation: {
            axialTilt: degreesToRadians(5),
            spinAxisAzimuth: degreesToRadians(246),
            siderealPeriod: getOrbitalPeriod(phileasOrbitRadius, aphrodite.mass),
            initialRotationAngle: degreesToRadians(354),
        },
        terrainSettings: {
            continents_fragmentation: 0.0,
            continent_base_height: 0,
            continents_frequency: 0.6,
            max_bump_height: 1e3,
            max_mountain_height: 10e3,
            mountains_frequency: 60 * 0.6,
            bumps_frequency: 30 * 0.6,
        },
        clouds: null,
        atmosphere: null,
        ocean: null,
        composition: {
            h2o: 0.01,
            rock: 0.99,
        },
        temperature: {
            min: 50,
            max: 350,
        },
    } satisfies TelluricSatelliteModel;

    const newJulesVerne: SpaceStationModel = {
        type: "spaceStation",
        name: "New Jules Verne",
        id: "newJulesVerne",
        mass: 10,
        orbit: {
            parentIds: ["aphrodite"],
            semiMajorAxis: aphrodite.rings.outerRadius * 1.5,
            inclination: degreesToRadians(30),
            initialMeanAnomaly: degreesToRadians(254),
            longitudeOfAscendingNode: degreesToRadians(23),
            argumentOfPeriapsis: degreesToRadians(6),
            eccentricity: 0.5,
            p: 2,
        },
        rotation: {
            siderealPeriod: 0,
            spinAxisAzimuth: 0,
            axialTilt: 0,
            initialRotationAngle: 0,
        },
        seed: 47,
        starSystemCoordinates: coordinates,
        agricultureMix: [[1, CropType.LENTIL]],
        nbHydroponicLayers: 2,
        annualEnergyPerCapitaKWh: 200_000,
        solarPanelEfficiency: 0.4,
        population: 300_000,
        populationDensity: 4_000,
        faction: "human_commonwealth",
        sections: [
            { type: "engineBay" },
            { type: "utility", hasTanks: true },
            { type: "utility", hasTanks: false },
            { type: "utility", hasTanks: false },
            { type: "utility", hasTanks: true },
            { type: "solar", surface: 10_000e3, axisCount: 3, secondaryArmCount: 2 },
            { type: "utility", hasTanks: true },
            { type: "utility", hasTanks: false },
            { type: "utility", hasTanks: false },
            { type: "utility", hasTanks: true },
            {
                type: "cylinderHabitat",
                radius: 3e3,
                surface: { housing: km2ToM2(300_000 / 4_000), agriculture: km2ToM2(300_000 / 4_000) * 0.3 },
            },
            { type: "utility", hasTanks: true },
            { type: "utility", hasTanks: false },
            { type: "utility", hasTanks: false },
            { type: "utility", hasTanks: true },
            { type: "landingBay", heightFactor: 2 },
        ],
    };

    const snowLine = getWaterIceFrostLine(vesta.blackBodyTemperature, vesta.radius);

    const melpomene: GasPlanetModel = {
        type: "gasPlanet",
        name: "Melpomene",
        id: "melpomene",
        radius: JupiterRadius * 0.7,
        mass: JupiterMass * 0.7 ** 3,
        seed: 43,
        rotation: {
            axialTilt: degreesToRadians(30),
            spinAxisAzimuth: degreesToRadians(75),
            initialRotationAngle: degreesToRadians(156),
            siderealPeriod: durationToSeconds({ hours: 16, minutes: 48, seconds: 9 }),
        },
        orbit: {
            parentIds: ["vesta"],
            semiMajorAxis: 1.2 * snowLine,
            eccentricity: 0.3,
            initialMeanAnomaly: degreesToRadians(254),
            inclination: degreesToRadians(7),
            longitudeOfAscendingNode: degreesToRadians(143),
            argumentOfPeriapsis: degreesToRadians(32),
            p: 2,
        },
        atmosphere: {
            pressure: barToPascal(1),
            greenHouseEffectFactor: 1,
        },
        colorPalette: {
            type: "procedural",
            color1: { r: 1, g: 1, b: 1 },
            color2: { r: 1, g: 1, b: 1 },
            color3: { r: 1, g: 1, b: 1 },
            colorSharpness: 1,
        },
        rings: null,
    };

    return {
        name: "Vesta",
        coordinates,
        stellarObjects: [vesta],
        planets: [janus, aphrodite, melpomene],
        satellites: [adonis, phileas],
        anomalies: [],
        orbitalFacilities: [newJulesVerne],
    };
}
