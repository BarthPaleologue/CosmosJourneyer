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

import { type GasPlanetModel } from "@/backend/universe/orbitalObjects/gasPlanetModel";
import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";
import { type TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";

import {
    astronomicalUnitToMeters,
    barToPascal,
    celsiusToKelvin,
    degreesToRadians,
} from "@/utils/physics/unitConversions";

import { getJupiterModel } from "./jupiter";
import { getSaturnModel } from "./saturn";
import { getSunModel } from "./sun";

export function getSolSystemModel(): StarSystemModel {
    const sun = getSunModel();

    const mercury: TelluricPlanetModel = {
        id: "mercury",
        name: "Mercury",
        type: "telluricPlanet",
        radius: 2_439.7e3,
        mass: 3.301e23,
        axialTilt: degreesToRadians(0.034),
        siderealDaySeconds: 60 * 60 * 24 * 58.646,
        waterAmount: 0,
        temperature: {
            min: 437,
            max: 437,
        },
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: astronomicalUnitToMeters(0.38),
            eccentricity: 0.2056,
            p: 2,
            inclination: degreesToRadians(7),
            longitudeOfAscendingNode: degreesToRadians(48.331),
            argumentOfPeriapsis: degreesToRadians(29.124),
            initialMeanAnomaly: 0,
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0,
        },
        atmosphere: null,
        rings: null,
        clouds: null,
        ocean: null,
        seed: 0,
    };

    const venus: TelluricPlanetModel = {
        id: "venus",
        name: "Venus",
        type: "telluricPlanet",
        radius: 6_051.8e3,
        mass: 4.8e20,
        axialTilt: degreesToRadians(177.36),
        siderealDaySeconds: 60 * 60 * 24 * 243.025,
        waterAmount: 0,
        temperature: {
            min: 719,
            max: 763,
        },
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 108_209_500e3,
            eccentricity: 0.0067,
            inclination: degreesToRadians(3.39),
            longitudeOfAscendingNode: degreesToRadians(76.68),
            argumentOfPeriapsis: degreesToRadians(54.88),
            initialMeanAnomaly: 0,
            p: 2,
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 20e3,
            continent_base_height: 0,

            mountains_frequency: 5,
        },
        rings: null,
        atmosphere: {
            pressure: barToPascal(93),
            greenHouseEffectFactor: 0.99,
        },
        clouds: {
            layerRadius: 6_051.8e3 + 10e3,
            smoothness: 0.7,
            specularPower: 2,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0,
            sharpness: 2.5,
            color: { r: 0.8, g: 0.8, b: 0.1 },
            worleySpeed: 0.0005,
            detailSpeed: 0.003,
        },
        ocean: null,
        seed: 0,
    };

    const earth: TelluricPlanetModel = {
        id: "earth",
        name: "Earth",
        type: "telluricPlanet",
        radius: 6_371e3,
        mass: 5.972e24,
        axialTilt: degreesToRadians(23.44),
        siderealDaySeconds: 60 * 60 * 24,
        waterAmount: 1,
        temperature: {
            min: celsiusToKelvin(-50),
            max: celsiusToKelvin(50),
        },
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 149_597_870e3,
            eccentricity: 0.0167,
            inclination: degreesToRadians(0),
            longitudeOfAscendingNode: degreesToRadians(0),
            argumentOfPeriapsis: degreesToRadians(114.20783),
            initialMeanAnomaly: 0,
            p: 2,
        },
        terrainSettings: {
            continents_frequency: 1,
            continents_fragmentation: 0.65,

            bumps_frequency: 30,

            max_bump_height: 1.5e3,
            max_mountain_height: 10e3,
            continent_base_height: 10e3 * 1.9,

            mountains_frequency: 360,
        },
        rings: null,
        atmosphere: {
            pressure: barToPascal(1),
            greenHouseEffectFactor: 0.5,
        },
        clouds: {
            layerRadius: 6_371e3 + 30e3,
            smoothness: 0.7,
            specularPower: 2,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0.5,
            sharpness: 2.5,
            color: { r: 0.8, g: 0.8, b: 0.8 },
            worleySpeed: 0.0005,
            detailSpeed: 0.003,
        },
        ocean: {
            depth: 10e3,
        },
        seed: 0,
    };

    const moon: TelluricSatelliteModel = {
        id: "moon",
        name: "Moon",
        type: "telluricSatellite",
        radius: 1_737.1e3,
        mass: 7.342e22,
        axialTilt: degreesToRadians(6.68),
        siderealDaySeconds: 60 * 60 * 24 * 27.322,
        waterAmount: 0,
        temperature: {
            min: 100,
            max: 100,
        },
        orbit: {
            parentIds: [earth.id],
            semiMajorAxis: 384_400e3,
            eccentricity: 0.0549,
            inclination: degreesToRadians(5.145),
            longitudeOfAscendingNode: degreesToRadians(125.08),
            argumentOfPeriapsis: degreesToRadians(318.15),
            initialMeanAnomaly: 0,
            p: 2,
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0,
        },
        atmosphere: null,
        clouds: null,
        ocean: null,
        seed: 0,
    };

    const mars: TelluricPlanetModel = {
        id: "mars",
        name: "Mars",
        type: "telluricPlanet",
        radius: 3_389.5e3,
        mass: 6.4171e23,
        axialTilt: degreesToRadians(25.19),
        siderealDaySeconds: 60 * 60 * 24 * 1.027,
        waterAmount: 0,
        temperature: {
            min: celsiusToKelvin(-140),
            max: celsiusToKelvin(20),
        },
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 227_939_200e3,
            eccentricity: 0.0934,
            inclination: degreesToRadians(1.85),
            longitudeOfAscendingNode: degreesToRadians(49.558),
            argumentOfPeriapsis: degreesToRadians(286.502),
            initialMeanAnomaly: 0,
            p: 2,
        },
        terrainSettings: {
            continents_fragmentation: 0.1,
            continents_frequency: 1,

            bumps_frequency: 10,
            max_bump_height: 15e3,

            max_mountain_height: 0e3,
            continent_base_height: 0,

            mountains_frequency: 0,
        },
        atmosphere: {
            pressure: barToPascal(0.006),
            greenHouseEffectFactor: 0.1,
        },
        rings: null,
        clouds: null,
        ocean: null,
        seed: 0,
    };

    const jupiter = getJupiterModel([sun.id]);

    const saturn = getSaturnModel([sun.id]);

    const uranus: GasPlanetModel = {
        id: "uranus",
        name: "Uranus",
        type: "gasPlanet",
        radius: 25_362e3,
        mass: 8.681e25,
        axialTilt: degreesToRadians(97.77),
        siderealDaySeconds: 60 * 60 * 17.24,
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 2_872_463_270e3,
            eccentricity: 0.0565,
            inclination: degreesToRadians(0.77),
            longitudeOfAscendingNode: degreesToRadians(74.229),
            argumentOfPeriapsis: degreesToRadians(96.541),
            initialMeanAnomaly: 0,
            p: 2,
        },
        colorPalette: {
            type: "textured",
            textureId: "uranus",
        },
        atmosphere: {
            pressure: barToPascal(0.1),
            greenHouseEffectFactor: 0.5,
        },
        rings: {
            innerRadius: 50_724e3,
            outerRadius: 62_000e3,
            type: "textured",
            textureId: "uranus",
        },
        seed: 0,
    };

    const neptune: GasPlanetModel = {
        id: "neptune",
        name: "Neptune",
        type: "gasPlanet",
        radius: 24_622e3,
        mass: 1.024e26,
        axialTilt: degreesToRadians(28.32),
        siderealDaySeconds: 60 * 60 * 16.11,
        orbit: {
            parentIds: [sun.id],
            semiMajorAxis: 4_495_060_000e3,
            eccentricity: 0.0086,
            inclination: degreesToRadians(1.77),
            longitudeOfAscendingNode: degreesToRadians(131.72169),
            argumentOfPeriapsis: degreesToRadians(265.646853),
            initialMeanAnomaly: 0,
            p: 2,
        },
        colorPalette: {
            type: "textured",
            textureId: "neptune",
        },
        atmosphere: {
            pressure: barToPascal(0.1),
            greenHouseEffectFactor: 0.7,
        },
        rings: null,
        seed: 0,
    };

    return {
        name: "Sol",
        coordinates: {
            starSectorX: 0,
            starSectorY: 0,
            starSectorZ: 0,
            localX: 0,
            localY: 0,
            localZ: 0,
        },
        stellarObjects: [sun],
        planets: [mercury, venus, earth, mars, jupiter, saturn, uranus, neptune],
        satellites: [moon],
        anomalies: [],
        orbitalFacilities: [],
    };
}
