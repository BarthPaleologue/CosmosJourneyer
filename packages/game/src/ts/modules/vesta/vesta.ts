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
    ampereSquareMeters,
    durationToSeconds,
    EarthMass,
    EarthMagneticDipoleMoment,
    EarthRadius,
    getOrbitalPeriod,
    getOrbitRadiusFromPeriod,
    getWaterIceFrostLine,
    JupiterMass,
    JupiterMagneticDipoleMoment,
    JupiterRadius,
    km2ToM2,
    SolarMass,
    SolarRadius,
    SolarTemperature,
    kelvin,
    kilograms,
    meters,
    radians,
    seconds,
    squareMeters,
} from "@cosmos-journeyer/physics";
import type {
    StarSystemCoordinates,
    StarModel,
    GasPlanetModel,
    TelluricPlanetModel,
    TelluricSatelliteModel,
    StarSystemModel,
} from "@cosmos-journeyer/universe-model";

import type { SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

import { CropType } from "@/utils/agriculture";

import type { MonolithModel } from "../monolith/entity";
import { DefaultOrbitalFacilityMass } from "../orbitalFacilities/constants";
import type { SpaceStationModel } from "../orbitalFacilities/spaceStationModel";
import type { RussellTeaPotModel } from "../russellTeaPot/russellTeaPotModel";
import { createSpaceTelescopeModel } from "../spaceTelescopes/spaceTelescopeModel";
import type { SpaceTelescopeModel } from "../spaceTelescopes/spaceTelescopeModel";

/** @returns The authored Vesta system. */
export function getVestaModel(): { starSystem: StarSystemModel; systemEntities: Array<SystemEntityModel> } {
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
        spin: {
            axialTilt: radians(0),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
            siderealPeriod: durationToSeconds({ days: 20, hours: 2, minutes: 5 }),
        },
        orbit: {
            semiMajorAxis: meters(0),
            eccentricity: 0,
            initialMeanAnomaly: radians(0),
            plane: {
                inclination: radians(0),
                longitudeOfAscendingNode: radians(0),
            },
            parentIds: [],
            argumentOfPeriapsis: radians(0),
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
        magneticField: null,
        radius: meters(EarthRadius * 0.1),
        mass: kilograms(EarthMass * 0.1 ** 3),
        seed: 44,
        spin: {
            axialTilt: degreesToRadians(5),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
            siderealPeriod: janusOrbitalPeriod,
        },
        orbit: {
            parentIds: ["vesta"],
            semiMajorAxis: janusOrbitRadius,
            eccentricity: 0,
            plane: {
                inclination: degreesToRadians(8),
                longitudeOfAscendingNode: degreesToRadians(45),
            },
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
            continent_base_height: meters(0),
            continents_frequency: 1.0,
            max_bump_height: meters(1e3),
            max_mountain_height: meters(10e3),
            mountains_frequency: 60,
            bumps_frequency: 30,
        },
        composition: {
            h2o: 0,
            rock: 1,
        },
        temperature: {
            min: kelvin(50),
            max: kelvin(400),
        },
    };

    const aphroditeRadius = meters(EarthRadius * 0.2);
    const aphrodite = {
        type: "telluricPlanet",
        name: "Aphrodite",
        id: "aphrodite",
        magneticField: {
            north: { latitude: degreesToRadians(80), longitude: radians(0) },
            magnitude: ampereSquareMeters(EarthMagneticDipoleMoment * 0.2 ** 3),
        },
        radius: aphroditeRadius,
        mass: kilograms(EarthMass * 0.2 ** 3),
        seed: 45,
        spin: {
            axialTilt: degreesToRadians(10),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
            siderealPeriod: durationToSeconds({ hours: 26, minutes: 21, seconds: 48 }),
        },
        orbit: {
            parentIds: ["vesta"],
            semiMajorAxis: astronomicalUnitToMeters(1),
            eccentricity: 0,
            plane: {
                inclination: degreesToRadians(2),
                longitudeOfAscendingNode: degreesToRadians(157),
            },
            initialMeanAnomaly: degreesToRadians(32),
            argumentOfPeriapsis: radians(0),
            p: 2,
        },
        rings: {
            type: "procedural",
            iceAlbedo: { r: 0.93, g: 0.92, b: 0.9 },
            dustAlbedo: { r: 0.85, g: 0.7, b: 0.65 },
            seed: 0.65,
            frequency: 5,
            innerRadius: meters(aphroditeRadius * 1.7),
            outerRadius: meters(aphroditeRadius * 3.0),
        },
        ocean: {
            depth: meters(10e3),
        },
        atmosphere: {
            pressure: barToPascal(1.2),
            greenHouseEffectFactor: 1,
        },
        clouds: {
            color: { r: 0.9, g: 0.9, b: 0.9 },
            coverage: 0.4,
            layerRadius: meters(aphroditeRadius + 20e3),
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
            continent_base_height: meters(10e3),
            continents_frequency: 1.0,
            max_bump_height: meters(1e3),
            max_mountain_height: meters(10e3),
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
        magneticField: null,
        radius: meters(EarthRadius * 0.02),
        mass: kilograms(EarthMass * 0.02 ** 3),
        seed: 74,
        orbit: {
            parentIds: ["aphrodite"],
            semiMajorAxis: meters(adonisOrbitRadius),
            eccentricity: 0,
            plane: {
                inclination: degreesToRadians(-4),
                longitudeOfAscendingNode: degreesToRadians(175),
            },
            initialMeanAnomaly: degreesToRadians(248),
            argumentOfPeriapsis: degreesToRadians(21),
            p: 2,
        },
        spin: {
            axialTilt: degreesToRadians(0.2),
            axisAzimuth: degreesToRadians(22),
            siderealPeriod: getOrbitalPeriod(meters(adonisOrbitRadius), aphrodite.mass),
            initialRotationAngle: degreesToRadians(18),
        },
        terrainSettings: {
            continents_fragmentation: 0.0,
            continent_base_height: meters(0),
            continents_frequency: 0.2,
            max_bump_height: meters(1e3),
            max_mountain_height: meters(2e3),
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
            min: kelvin(50),
            max: kelvin(350),
        },
    } satisfies TelluricSatelliteModel;

    const phileasOrbitRadius = getOrbitRadiusFromPeriod(durationToSeconds({ days: 80 }), aphrodite.mass);
    const phileas = {
        type: "telluricSatellite",
        name: "Phileas",
        id: "phileas",
        magneticField: null,
        radius: meters(EarthRadius * 0.1),
        mass: kilograms(EarthMass * 0.1 ** 3),
        seed: 62,
        orbit: {
            parentIds: ["aphrodite"],
            semiMajorAxis: phileasOrbitRadius,
            eccentricity: 0,
            plane: {
                inclination: degreesToRadians(1),
                longitudeOfAscendingNode: degreesToRadians(15),
            },
            initialMeanAnomaly: degreesToRadians(23),
            argumentOfPeriapsis: degreesToRadians(76),
            p: 2,
        },
        spin: {
            axialTilt: degreesToRadians(5),
            axisAzimuth: degreesToRadians(246),
            siderealPeriod: getOrbitalPeriod(phileasOrbitRadius, aphrodite.mass),
            initialRotationAngle: degreesToRadians(354),
        },
        terrainSettings: {
            continents_fragmentation: 0.0,
            continent_base_height: meters(0),
            continents_frequency: 0.6,
            max_bump_height: meters(1e3),
            max_mountain_height: meters(10e3),
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
            min: kelvin(50),
            max: kelvin(350),
        },
    } satisfies TelluricSatelliteModel;

    const newJulesVerne: SystemEntityModel<SpaceStationModel> = {
        name: "New Jules Verne",
        id: "newJulesVerne",
        content: {
            type: "spaceStation",
            agricultureMix: [[1, CropType.LENTIL]],
            nbHydroponicLayers: 2,
            annualEnergyPerCapitaKWh: 200_000,
            solarPanelEfficiency: 0.4,
            population: 300_000,
            populationDensity: 4_000,
            sections: [
                { type: "engineBay" },
                { type: "utility", hasTanks: true },
                { type: "utility", hasTanks: false },
                { type: "utility", hasTanks: false },
                { type: "utility", hasTanks: true },
                { type: "solar", surface: squareMeters(10_000e3), axisCount: 3, secondaryArmCount: 2 },
                { type: "utility", hasTanks: true },
                { type: "utility", hasTanks: false },
                { type: "utility", hasTanks: false },
                { type: "utility", hasTanks: true },
                {
                    type: "cylinderHabitat",
                    radius: meters(3e3),
                    surface: {
                        housing: km2ToM2(300_000 / 4_000),
                        agriculture: squareMeters(km2ToM2(300_000 / 4_000) * 0.3),
                    },
                },
                { type: "utility", hasTanks: true },
                { type: "utility", hasTanks: false },
                { type: "utility", hasTanks: false },
                { type: "utility", hasTanks: true },
                { type: "landingBay", heightFactor: 2 },
            ],
        },
        placement: {
            type: "inOrbit",
            mass: DefaultOrbitalFacilityMass,
            orbit: {
                parentIds: ["aphrodite"],
                semiMajorAxis: meters(aphrodite.rings.outerRadius * 1.5),
                plane: {
                    inclination: degreesToRadians(30),
                    longitudeOfAscendingNode: degreesToRadians(23),
                },
                initialMeanAnomaly: degreesToRadians(254),
                argumentOfPeriapsis: degreesToRadians(6),
                eccentricity: 0.5,
                p: 2,
            },
            attitude: {
                spin: {
                    siderealPeriod: seconds(0),
                    axisAzimuth: radians(0),
                    axialTilt: radians(0),
                    initialRotationAngle: radians(0),
                },
                localFrameOrientation: { yaw: radians(0), pitch: radians(0), roll: radians(0) },
            },
        },
    };

    const snowLine = getWaterIceFrostLine(vesta.blackBodyTemperature, vesta.radius);

    const melpomene: GasPlanetModel = {
        type: "gasPlanet",
        name: "Melpomene",
        id: "melpomene",
        radius: meters(JupiterRadius * 0.7),
        mass: kilograms(JupiterMass * 0.7 ** 3),
        seed: 43,
        spin: {
            axialTilt: degreesToRadians(30),
            axisAzimuth: degreesToRadians(75),
            initialRotationAngle: degreesToRadians(156),
            siderealPeriod: durationToSeconds({ hours: 16, minutes: 48, seconds: 9 }),
        },
        orbit: {
            parentIds: ["vesta"],
            semiMajorAxis: meters(1.2 * snowLine),
            eccentricity: 0.3,
            initialMeanAnomaly: degreesToRadians(254),
            plane: {
                inclination: degreesToRadians(7),
                longitudeOfAscendingNode: degreesToRadians(143),
            },
            argumentOfPeriapsis: degreesToRadians(32),
            p: 2,
        },
        atmosphere: {
            pressure: barToPascal(1),
            greenHouseEffectFactor: 1,
        },
        magneticField: {
            north: { latitude: degreesToRadians(80), longitude: radians(0) },
            magnitude: ampereSquareMeters(JupiterMagneticDipoleMoment * 0.7 ** 3),
        },
        colorPalette: {
            type: "procedural",
            color1: { r: 0.2, g: 0.7, b: 0.3 },
            color2: { r: 1, g: 1, b: 1 },
            color3: { r: 0.0, g: 0.5, b: 0.0 },
            colorSharpness: 0.8,
        },
        rings: null,
    };

    const monolith: SystemEntityModel<MonolithModel> = {
        id: "monolith",
        name: "Monolith",
        content: {
            type: "monolith",
        },
        placement: {
            type: "onSurface",
            parentId: phileas.id,
            position: {
                latitude: radians(0.02151829597894311),
                longitude: radians(2.426090777615558),
                heightAboveGround: meters(-0.3),
            },
            rotation: {
                roll: radians(0),
                pitch: radians(0),
                heading: radians(0),
            },
        },
    };

    const spaceTelescopeOrbitRadius = astronomicalUnitToMeters(3);
    const spaceTelescope: SystemEntityModel<SpaceTelescopeModel> = {
        id: "vestaSpaceTelescope",
        name: "Vesta Deep Space Telescope",
        content: createSpaceTelescopeModel(),
        placement: {
            type: "inOrbit",
            mass: kilograms(100_000),
            orbit: {
                parentIds: [vesta.id],
                semiMajorAxis: spaceTelescopeOrbitRadius,
                eccentricity: 0,
                plane: {
                    inclination: radians(0),
                    longitudeOfAscendingNode: radians(0),
                },
                argumentOfPeriapsis: radians(0),
                initialMeanAnomaly: radians(0),
                p: 2,
            },
            attitude: {
                spin: {
                    axialTilt: radians(0),
                    axisAzimuth: radians(0),
                    initialRotationAngle: radians(0),
                    siderealPeriod: getOrbitalPeriod(spaceTelescopeOrbitRadius, vesta.mass),
                },
                localFrameOrientation: { yaw: radians(0), pitch: radians(0), roll: radians(-Math.PI / 2) },
            },
        },
    };

    const russellTeapot: SystemEntityModel<RussellTeaPotModel> = {
        id: "russellTeapot",
        name: "Unassuming teapot",
        content: {
            type: "russellTeaPot",
        },
        placement: {
            type: "inOrbit",
            mass: kilograms(0.5),
            orbit: {
                parentIds: [melpomene.id],
                semiMajorAxis: meters(4.2 * melpomene.radius),
                eccentricity: 0.2,
                plane: {
                    inclination: degreesToRadians(22),
                    longitudeOfAscendingNode: radians(0),
                },
                argumentOfPeriapsis: radians(0),
                initialMeanAnomaly: radians(0),
                p: 2,
            },
            attitude: {
                spin: {
                    axialTilt: degreesToRadians(67),
                    axisAzimuth: radians(0),
                    initialRotationAngle: radians(0),
                    siderealPeriod: durationToSeconds({ minutes: 4, seconds: 23 }),
                },
                localFrameOrientation: {
                    yaw: radians(0),
                    pitch: radians(0),
                    roll: radians(0),
                },
            },
        },
    };

    return {
        starSystem: {
            name: "Vesta",
            coordinates,
            stellarObjects: [vesta],
            planets: [janus, aphrodite, melpomene],
            satellites: [adonis, phileas],
            anomalies: [],
        },
        systemEntities: [monolith, spaceTelescope, russellTeapot, newJulesVerne],
    };
}
