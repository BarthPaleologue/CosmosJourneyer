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

import {
    computeMeanTemperature,
    estimateStarRadiusFromMass,
    getApparentGravityOnSpaceTether,
    getGravitationalLensFocalDistance,
    getRotationPeriodForArtificialGravity,
    hasLiquidWater,
    waterBoilingTemperature,
} from "./physics";
import { astronomicalUnitToMeters } from "./unitConversions";

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
    expect(focalLength).toBeGreaterThan(astronomicalUnitToMeters(530));
    expect(focalLength).toBeLessThan(astronomicalUnitToMeters(550));
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
