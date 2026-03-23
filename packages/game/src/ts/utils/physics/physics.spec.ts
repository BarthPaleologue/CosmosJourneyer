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
    computeEffectiveTemperature,
    computeGrayAtmosphereTemperature,
    estimateStarRadiusFromMass,
    getApparentGravityOnSpaceTether,
    getGravitationalLensFocalDistance,
    getOceanDepth,
    getRotationPeriodForArtificialGravity,
    getWaterIceFrostLine,
    hasLiquidWater,
    waterBoilingTemperature,
} from "./physics";
import { astronomicalUnitToMeters } from "./unitConversions";

test("computeEffectiveTemperature", () => {
    const sunTemperature = 5778; // in Kelvin
    const sunRadius = 6.9634e8; // in meters
    const sunEarthDistance = 1.496e11; // in meters
    const earthAlbedo = 0.3;

    const effectiveTemperature = computeEffectiveTemperature(
        [{ temperature: sunTemperature, radius: sunRadius, distance: sunEarthDistance }],
        earthAlbedo,
    );
    const targetEarthEffectiveTemperature = 255; // in Kelvin
    expect(effectiveTemperature).toBeGreaterThan(targetEarthEffectiveTemperature - 5);
    expect(effectiveTemperature).toBeLessThan(targetEarthEffectiveTemperature + 5);
});

test("computeEffectiveTemperature with two identical stars", () => {
    const starTemperature = 5778; // in Kelvin
    const starRadius = 6.9634e8; // in meters
    const starDistance = 1.496e11; // in meters
    const planetAlbedo = 0.3;

    const singleStarTemperature = computeEffectiveTemperature(
        [{ temperature: starTemperature, radius: starRadius, distance: starDistance }],
        planetAlbedo,
    );
    const binaryStarTemperature = computeEffectiveTemperature(
        [
            { temperature: starTemperature, radius: starRadius, distance: starDistance },
            { temperature: starTemperature, radius: starRadius, distance: starDistance },
        ],
        planetAlbedo,
    );

    expect(binaryStarTemperature).toBeCloseTo(singleStarTemperature * Math.pow(2, 0.25), 10);
});

test("computeGrayAtmosphereTemperature", () => {
    const effectiveTemperature = 255; // in Kelvin
    const earthOpticalDepth = 1.5;
    const surfaceTemperature = computeGrayAtmosphereTemperature(effectiveTemperature, earthOpticalDepth);
    const targetEarthTemperatureWithGreenHouseEffect = 289; // in Kelvin
    expect(surfaceTemperature).toBeGreaterThan(targetEarthTemperatureWithGreenHouseEffect - 5);
    expect(surfaceTemperature).toBeLessThan(targetEarthTemperatureWithGreenHouseEffect + 5);
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

describe("getWaterIceFrostLine", () => {
    test("sol places the water ice line inside the asteroid belt", () => {
        const sunTemperature = 5778; // in Kelvin
        const sunRadius = 6.9634e8; // in meters

        const frostLine = getWaterIceFrostLine(sunTemperature, sunRadius);

        expect(frostLine).toBeGreaterThan(astronomicalUnitToMeters(2.2));
        expect(frostLine).toBeLessThan(astronomicalUnitToMeters(3.2));
    });
});

describe("getOceanDepth", () => {
    test("earth", () => {
        const earthRadius = 6_371e3; // in meters
        const earthMass = 5.972e24; // in kilograms
        const earthLiquidWaterMassFraction = 1.4e21 / earthMass; // total water mass relative to Earth mass
        const earthOceanCoverage = 0.71; // about 71% ocean coverage

        const oceanDepth = getOceanDepth(earthRadius, earthMass, earthLiquidWaterMassFraction, earthOceanCoverage);

        // Earth's mean ocean depth is about 3.7 km.
        expect(oceanDepth).toBeGreaterThan(3.5e3);
        expect(oceanDepth).toBeLessThan(4.0e3);
    });

    test("gets shallower as ocean coverage increases for the same water inventory", () => {
        const planetRadius = 6_371e3;
        const planetMass = 5.972e24;
        const liquidWaterMassFraction = 1.4e21 / planetMass;

        const deepOcean = getOceanDepth(planetRadius, planetMass, liquidWaterMassFraction, 0.1);
        const shallowOcean = getOceanDepth(planetRadius, planetMass, liquidWaterMassFraction, 0.5);

        expect(deepOcean).toBeGreaterThan(shallowOcean);
    });
});
