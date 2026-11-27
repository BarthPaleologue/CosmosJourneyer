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

import { describe, expect, it, test } from "vitest";

import { EarthMass, EarthRadius, SolarMass, SolarRadius } from "./constants";
import {
    computeEffectiveTemperature,
    computeGrayAtmosphereTemperature,
    estimateStarRadiusFromMass,
    getApparentGravityOnSpaceTether,
    getEscapeVelocity,
    getGravitationalLensFocalDistance,
    getOceanDepth,
    getRotationPeriodForArtificialGravity,
    getSilicateRockSublimationLine,
    getTemperatureLine,
    getWaterIceFrostLine,
    getWaterSaturationPressure,
    hasLiquidWater,
    waterBoilingTemperature,
} from "./physics";
import { astronomicalUnitToMeters } from "./unitConversions";
import { kelvin, kilograms, meters, metersPerSecondSquared, pascals, seconds } from "./units";

describe("getEscapeVelocity", () => {
    it("estimates the solar surface escape speed", () => {
        expect(getEscapeVelocity(SolarMass, SolarRadius) / 1e3).toBeCloseTo(617.5, 0);
    });

    it("estimates Earth's surface escape speed", () => {
        expect(getEscapeVelocity(EarthMass, EarthRadius) / 1e3).toBeCloseTo(11.19, 2);
    });
});

test("computeEffectiveTemperature", () => {
    const sunTemperature = kelvin(5778); // in Kelvin
    const sunRadius = meters(6.9634e8); // in meters
    const sunEarthDistance = meters(1.496e11); // in meters
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
    const starTemperature = kelvin(5778); // in Kelvin
    const starRadius = meters(6.9634e8); // in meters
    const starDistance = meters(1.496e11); // in meters
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
    const effectiveTemperature = kelvin(255); // in Kelvin
    const earthOpticalDepth = 1.5;
    const surfaceTemperature = computeGrayAtmosphereTemperature(effectiveTemperature, earthOpticalDepth);
    const targetEarthTemperatureWithGreenHouseEffect = 289; // in Kelvin
    expect(surfaceTemperature).toBeGreaterThan(targetEarthTemperatureWithGreenHouseEffect - 5);
    expect(surfaceTemperature).toBeLessThan(targetEarthTemperatureWithGreenHouseEffect + 5);
});

describe("waterBoilingPointCelsius", () => {
    test("earth", () => {
        const earthPressure = pascals(101325); // in pascal
        const boilingPoint = waterBoilingTemperature(earthPressure);
        expect(boilingPoint).toBeGreaterThan(273.15 + 99);
        expect(boilingPoint).toBeLessThan(273.15 + 101);
    });

    test("moon", () => {
        const moonPressure = pascals(0); // in pascal
        const boilingPoint = waterBoilingTemperature(moonPressure);
        expect(boilingPoint).toBe(0);
    });
});

describe("getWaterSaturationPressure", () => {
    test("matches an Earth-like freezing-point reference value", () => {
        const freezingPoint = kelvin(273.15); // in Kelvin
        const saturationPressure = getWaterSaturationPressure(freezingPoint);

        expect(saturationPressure).toBeGreaterThan(600);
        expect(saturationPressure).toBeLessThan(650);
    });

    test("increases with temperature", () => {
        const coldPressure = getWaterSaturationPressure(kelvin(260));
        const temperatePressure = getWaterSaturationPressure(kelvin(293.15));
        const hotPressure = getWaterSaturationPressure(kelvin(320));

        expect(temperatePressure).toBeGreaterThan(coldPressure);
        expect(hotPressure).toBeGreaterThan(temperatePressure);
    });
});

test("estimateStarRadiusFromMass", () => {
    const solarMass = kilograms(1.989e30); // in kg
    const solarRadius = meters(6.9634e8); // in meters

    const estimatedRadius = estimateStarRadiusFromMass(solarMass);
    expect(estimatedRadius).toBeGreaterThan(solarRadius - 0.1 * solarRadius);
    expect(estimatedRadius).toBeLessThan(solarRadius + 0.1 * solarRadius);
});

test("gravitationalLensing", () => {
    const solarMass = kilograms(1.989e30); // in kg
    const solarRadius = meters(6.9634e8); // in meters

    const focalLength = getGravitationalLensFocalDistance(solarMass, solarRadius);
    expect(focalLength).toBeGreaterThan(astronomicalUnitToMeters(530));
    expect(focalLength).toBeLessThan(astronomicalUnitToMeters(550));
});

describe("hasLiquidWater", () => {
    test("earth-like planet", () => {
        const pressure = pascals(101325); // in pascal
        const minTemperature = kelvin(273.15 - 20); // in Kelvin
        const maxTemperature = kelvin(273.15 + 100); // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(true);
    });

    test("mars-like planet", () => {
        const pressure = pascals(610); // in pascal
        const minTemperature = kelvin(273.15 - 60); // in Kelvin
        const maxTemperature = kelvin(273.15 + 20); // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });

    test("venus-like planet", () => {
        const pressure = pascals(9.2e6); // in pascal
        const minTemperature = kelvin(273.15 + 400); // in Kelvin
        const maxTemperature = kelvin(273.15 + 800); // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });

    test("ice world", () => {
        const pressure = pascals(101325); // in pascal
        const minTemperature = kelvin(273.15 - 60); // in Kelvin
        const maxTemperature = kelvin(273.15 - 20); // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });

    test("airless world", () => {
        const pressure = pascals(0.0); // in pascal
        const minTemperature = kelvin(273.15 - 20); // in Kelvin
        const maxTemperature = kelvin(273.15 + 100); // in Kelvin

        const canHaveLiquidWater = hasLiquidWater(pressure, minTemperature, maxTemperature);
        expect(canHaveLiquidWater).toBe(false);
    });
});

test("getRotationPeriodForArtificialGravity", () => {
    const ringRadius = meters(1000); // in meters
    const desiredGravity = metersPerSecondSquared(9.81); // in m/s²

    const period = getRotationPeriodForArtificialGravity(ringRadius, desiredGravity);

    expect(period).toBeGreaterThan(63 - 1);
    expect(period).toBeLessThan(63 + 1);
});

describe("getApparentGravityOnSpaceTether", () => {
    test("earth geostationary orbit", () => {
        const earthMass = kilograms(5.972e24); // in kg
        const earthSiderealDayDuration = seconds(86164.1); // in seconds
        const geostationaryOrbitRadius = meters(42_164e3); // in meters
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
            meters(geostationaryOrbitRadius + 10_000e3),
        );
        expect(apparentGravityAboveGeoOrbit).toBeGreaterThan(0);

        // and should decrease as we move closer to earth
        const apparentGravityBelowGeoOrbit = getApparentGravityOnSpaceTether(
            earthSiderealDayDuration,
            earthMass,
            meters(geostationaryOrbitRadius - 10_000e3),
        );
        expect(apparentGravityBelowGeoOrbit).toBeLessThan(0);
    });
});

describe("getWaterIceFrostLine", () => {
    test("sol places the water ice line inside the asteroid belt", () => {
        const sunTemperature = kelvin(5778); // in Kelvin
        const sunRadius = meters(6.9634e8); // in meters

        const frostLine = getWaterIceFrostLine(sunTemperature, sunRadius);

        expect(frostLine).toBeGreaterThan(astronomicalUnitToMeters(2.2));
        expect(frostLine).toBeLessThan(astronomicalUnitToMeters(3.2));
    });
});

describe("getSilicateRockSublimationLine", () => {
    test("sol places the silicate sublimation line well inside Mercury's orbit", () => {
        const sunTemperature = kelvin(5778); // in Kelvin
        const sunRadius = meters(6.9634e8); // in meters

        const sublimationLine = getSilicateRockSublimationLine(sunTemperature, sunRadius);

        expect(sublimationLine).toBeGreaterThan(astronomicalUnitToMeters(0.03));
        expect(sublimationLine).toBeLessThan(astronomicalUnitToMeters(0.06));
    });
});

describe("getTemperatureLine", () => {
    test("matches the equilibrium distance for Earth-like stellar heating", () => {
        const sunTemperature = kelvin(5778); // in Kelvin
        const sunRadius = meters(6.9634e8); // in meters
        const earthEffectiveTemperature = kelvin(278); // in Kelvin for a simple black-body estimate

        const temperatureLine = getTemperatureLine(sunTemperature, sunRadius, earthEffectiveTemperature);

        expect(temperatureLine).toBeGreaterThan(astronomicalUnitToMeters(0.95));
        expect(temperatureLine).toBeLessThan(astronomicalUnitToMeters(1.05));
    });

    test("scales with the inverse square of the target temperature", () => {
        const stellarTemperature = kelvin(5778);
        const stellarRadius = meters(6.9634e8);

        const coolLine = getTemperatureLine(kelvin(stellarTemperature), meters(stellarRadius), kelvin(300));
        const hotLine = getTemperatureLine(kelvin(stellarTemperature), meters(stellarRadius), kelvin(600));

        expect(coolLine).toBeCloseTo(hotLine * 4, 10);
    });
});

describe("getOceanDepth", () => {
    test("earth", () => {
        const earthRadius = meters(6_371e3); // in meters
        const earthMass = kilograms(5.972e24); // in kilograms
        const earthLiquidWaterMassFraction = 1.4e21 / earthMass; // total water mass relative to Earth mass
        const earthOceanCoverage = 0.71; // about 71% ocean coverage

        const oceanDepth = getOceanDepth(earthRadius, earthMass, earthLiquidWaterMassFraction, earthOceanCoverage);

        // Earth's mean ocean depth is about 3.7 km.
        expect(oceanDepth).toBeGreaterThan(3.5e3);
        expect(oceanDepth).toBeLessThan(4.0e3);
    });

    test("gets shallower as ocean coverage increases for the same water inventory", () => {
        const planetRadius = meters(6_371e3);
        const planetMass = kilograms(5.972e24);
        const liquidWaterMassFraction = 1.4e21 / planetMass;

        const deepOcean = getOceanDepth(planetRadius, planetMass, liquidWaterMassFraction, 0.1);
        const shallowOcean = getOceanDepth(planetRadius, planetMass, liquidWaterMassFraction, 0.5);

        expect(deepOcean).toBeGreaterThan(shallowOcean);
    });
});
