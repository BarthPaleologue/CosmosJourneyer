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

import { describe, expect, test } from "vitest";

import { Settings } from "../settings";
import {
    celsiusToKelvin,
    computeMeanTemperature,
    estimateStarRadiusFromMass,
    getApparentGravityOnSpaceTether,
    getGravitationalLensFocalDistance,
    getOrbitRadiusFromPeriod,
    getRadiatedEnergyFlux,
    getRotationPeriodForArtificialGravity,
    getSchwarzschildRadius,
    getSphereRadiatedEnergyFlux,
    getSphereTotalRadiatedEnergy,
    hasLiquidWater,
    kelvinToCelsius,
    waterBoilingTemperature,
} from "./physics";

test("celsiusToKelvin", () => {
    expect(celsiusToKelvin(0)).toBe(273.15);
    expect(celsiusToKelvin(100)).toBe(373.15);
    expect(celsiusToKelvin(-273.15)).toBe(0);
});

test("kelvinToCelsius", () => {
    expect(kelvinToCelsius(0)).toBe(-273.15);
    expect(kelvinToCelsius(273.15)).toBe(0);
    expect(kelvinToCelsius(373.15)).toBe(100);
});

test("computeMeanTemperature", () => {
    const sunTemperature = 5778; // in Kelvin
    const sunRadius = 6.9634e8; // in meters
    const sunEarthDistance = 1.496e11; // in meters
    const earthAlbedo = 0.3;

    const meanTemperatureWithoutGreenHouseEffect = computeMeanTemperature(
        sunTemperature,
        sunRadius,
        sunEarthDistance,
        earthAlbedo,
        0,
    );
    const targetEarthTemperatureWithoutGreenHouseEffect = 255; // in Kelvin
    expect(meanTemperatureWithoutGreenHouseEffect).toBeGreaterThan(targetEarthTemperatureWithoutGreenHouseEffect - 5);
    expect(meanTemperatureWithoutGreenHouseEffect).toBeLessThan(targetEarthTemperatureWithoutGreenHouseEffect + 5);

    const greenHouseEffect = 0.4;
    const meanTemperatureWithGreenHouseEffect = computeMeanTemperature(
        sunTemperature,
        sunRadius,
        sunEarthDistance,
        earthAlbedo,
        greenHouseEffect,
    );
    const targetEarthTemperatureWithGreenHouseEffect = 289; // in Kelvin
    expect(meanTemperatureWithGreenHouseEffect).toBeGreaterThan(targetEarthTemperatureWithGreenHouseEffect - 5);
    expect(meanTemperatureWithGreenHouseEffect).toBeLessThan(targetEarthTemperatureWithGreenHouseEffect + 5);
});

describe("waterBoilingPointCelsius", () => {
    test("earth", () => {
        const earthPressure = 101325; // in pascal
        const boilingPoint = waterBoilingTemperature(earthPressure);
        expect(boilingPoint).toBeGreaterThan(273.15 + 99);
        expect(boilingPoint).toBeLessThan(273.15 + 101);
    });

    test("moon", () => {
        const moonPressure = 0; // in pascal
        const boilingPoint = waterBoilingTemperature(moonPressure);
        expect(boilingPoint).toBe(0);
    });
});

test("estimateStarRadiusFromMass", () => {
    const solarMass = 1.989e30; // in kg
    const solarRadius = 6.9634e8; // in meters

    const estimatedRadius = estimateStarRadiusFromMass(solarMass);
    expect(estimatedRadius).toBeGreaterThan(solarRadius - 0.1 * solarRadius);
    expect(estimatedRadius).toBeLessThan(solarRadius + 0.1 * solarRadius);
});

test("gravitationalLensing", () => {
    const solarMass = 1.989e30; // in kg
    const solarRadius = 6.9634e8; // in meters

    const focalLength = getGravitationalLensFocalDistance(solarMass, solarRadius);
    expect(focalLength).toBeGreaterThan(530 * Settings.AU);
    expect(focalLength).toBeLessThan(550 * Settings.AU);
});

describe("hasLiquidWater", () => {
    test("earth-like planet", () => {
        const pressure = 101325; // in pascal
        const minTemperature = 273.15 - 20; // in Kelvin
        const maxTemperature = 273.15 + 100; // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(true);
    });

    test("mars-like planet", () => {
        const pressure = 610; // in pascal
        const minTemperature = 273.15 - 60; // in Kelvin
        const maxTemperature = 273.15 + 20; // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });

    test("venus-like planet", () => {
        const pressure = 9.2e6; // in pascal
        const minTemperature = 273.15 + 400; // in Kelvin
        const maxTemperature = 273.15 + 800; // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });

    test("ice world", () => {
        const pressure = 101325; // in pascal
        const minTemperature = 273.15 - 60; // in Kelvin
        const maxTemperature = 273.15 - 20; // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });

    test("airless world", () => {
        const pressure = 0.0; // in pascal
        const minTemperature = 273.15 - 20; // in Kelvin
        const maxTemperature = 273.15 + 100; // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });
});

test("getRotationPeriodForArtificialGravity", () => {
    const ringRadius = 1000; // in meters
    const desiredGravity = 9.81; // in m/s^2

    const period = getRotationPeriodForArtificialGravity(ringRadius, desiredGravity);

    expect(period).toBeGreaterThan(63 - 1);
    expect(period).toBeLessThan(63 + 1);
});

describe("getSchwarzschildRadius", () => {
    test("sun mass", () => {
        const solarMass = 1.989e30; // in kg
        const schwarzschildRadius = getSchwarzschildRadius(solarMass);

        expect(schwarzschildRadius).toBeGreaterThan(2.95e3);
        expect(schwarzschildRadius).toBeLessThan(3.05e3);
    });

    test("earth mass", () => {
        const earthMass = 5.972e24;
        const schwarzschildRadius = getSchwarzschildRadius(earthMass);

        expect(schwarzschildRadius).toBeGreaterThan(8.85e-3);
        expect(schwarzschildRadius).toBeLessThan(8.95e-3);
    });
});

describe("getOrbitRadiusFromPeriod", () => {
    test("earth orbit", () => {
        const sunMass = 1.989e30; // in kg
        const earthPeriod = 365.25 * 24 * 60 * 60; // in seconds
        const earthOrbitRadius = getOrbitRadiusFromPeriod(earthPeriod, sunMass);

        expect(earthOrbitRadius).toBeGreaterThan(1.49e11 - 1e9);
        expect(earthOrbitRadius).toBeLessThan(1.49e11 + 1e9);
    });

    test("moon orbit", () => {
        const earthMass = 5.972e24;
        const moonPeriod = 27.3 * 24 * 60 * 60; // in seconds
        const moonOrbitRadius = getOrbitRadiusFromPeriod(moonPeriod, earthMass);

        expect(moonOrbitRadius).toBeGreaterThan(3.84e8 - 2e6);
        expect(moonOrbitRadius).toBeLessThan(3.84e8 + 2e6);
    });
});

describe("getApparentGravityOnSpaceTether", () => {
    test("earth geostationary orbit", () => {
        const earthMass = 5.972e24; // in kg
        const earthSiderealDayDuration = 86164.1; // in seconds
        const geostationaryOrbitRadius = 42_164e3; // in meters
        const apparentGravity = getApparentGravityOnSpaceTether(
            earthSiderealDayDuration,
            earthMass,
            geostationaryOrbitRadius,
        );

        // The apparent gravity should be zero at the geostationary orbit
        expect(apparentGravity).toBeCloseTo(0);

        // and should increase as we move further away from the geostationary orbit
        const apparentGravityAboveGeoOrbit = getApparentGravityOnSpaceTether(
            earthSiderealDayDuration,
            earthMass,
            geostationaryOrbitRadius + 10_000e3,
        );
        expect(apparentGravityAboveGeoOrbit).toBeGreaterThan(0);

        // and should decrease as we move closer to earth
        const apparentGravityBelowGeoOrbit = getApparentGravityOnSpaceTether(
            earthSiderealDayDuration,
            earthMass,
            geostationaryOrbitRadius - 10_000e3,
        );
        expect(apparentGravityBelowGeoOrbit).toBeLessThan(0);
    });
});

describe("Stefan-Boltzmann Law Functions", () => {
    test("getRadiatedEnergyFlux should calculate the energy flux correctly", () => {
        const temperature = 300; // in Kelvin
        const expectedFlux = 5.67e-8 * temperature ** 4;
        const flux = getRadiatedEnergyFlux(300);
        expect(flux).toBeCloseTo(expectedFlux, 5);
    });

    test("getSphereTotalRadiatedEnergy should calculate the total radiated energy correctly", () => {
        const temperature = 5778; // in Kelvin
        const radius = 6.9634e8; // in meters
        const expectedTotalEnergy = 5.67e-8 * temperature ** 4 * 4 * Math.PI * radius ** 2;
        const totalEnergy = getSphereTotalRadiatedEnergy(temperature, radius);
        expect(totalEnergy).toBeCloseTo(expectedTotalEnergy, 5);
    });

    test("getSphereRadiatedEnergyFlux should calculate the radiated energy flux at a distance correctly", () => {
        const temperatureSun = 5778; // in Kelvin
        const radiusSun = 6.9634e8; // in meters
        const distanceSun = 1.496e11; // in meters
        const expectedFluxAtDistance = 1360; // in W/m^2
        const fluxAtDistance = getSphereRadiatedEnergyFlux(temperatureSun, radiusSun, distanceSun);
        expect(fluxAtDistance).toBeGreaterThanOrEqual(expectedFluxAtDistance - 100);
        expect(fluxAtDistance).toBeLessThanOrEqual(expectedFluxAtDistance + 100);
    });
});
