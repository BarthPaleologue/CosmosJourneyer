import { describe, expect, it } from "vitest";

import {
    getDipoleFieldLineLatitude,
    getMagnetopauseStandoffDistance,
    getPolarCapLatitude,
    getStellarWind,
    getStellarWindDynamicPressure,
} from "./aurora";
import type { LocalStellarWindModel } from "./aurora";
import { EarthMagneticDipoleMoment, SolarMass, SolarRadius } from "./constants/astrophysics";
import { astronomicalUnitToMeters, degreesToRadians } from "./unitConversions";

// values from https://hdrl.gsfc.nasa.gov/LWS_Space_Weather/ACE_description.html
const solarWind: LocalStellarWindModel = {
    speed: 400_000,
    protonNumberDensity: 5e6,
};
const earthRadius = 6_371e3;

describe("getStellarWind", () => {
    it("keeps the solar mass loss calibration while using surface escape speed", () => {
        const wind = getStellarWind(SolarMass, SolarRadius, astronomicalUnitToMeters(1));

        expect(wind.speed / 1e3).toBeCloseTo(617.5, 0);
        expect(wind.protonNumberDensity / 1e6).toBeCloseTo(3.24, 2);
        expect(getStellarWindDynamicPressure(wind) / 1e-9).toBeCloseTo(2.07, 2);
    });

    it("dilutes the wind with the square of distance without changing its speed", () => {
        const near = getStellarWind(SolarMass, SolarRadius, astronomicalUnitToMeters(1));
        const far = getStellarWind(SolarMass, SolarRadius, astronomicalUnitToMeters(2));

        expect(far.speed).toBe(near.speed);
        expect(far.protonNumberDensity).toBeCloseTo(near.protonNumberDensity / 4);
    });

    it("scales mass loss with stellar surface area at equal escape speed", () => {
        const solar = getStellarWind(SolarMass, SolarRadius, astronomicalUnitToMeters(1));
        const larger = getStellarWind(2 * SolarMass, 2 * SolarRadius, astronomicalUnitToMeters(1));

        expect(larger.speed).toBe(solar.speed);
        expect(larger.protonNumberDensity).toBeCloseTo(4 * solar.protonNumberDensity);
    });

    it("reduces density when a faster wind carries the same mass loss", () => {
        const solar = getStellarWind(SolarMass, SolarRadius, astronomicalUnitToMeters(1));
        const massive = getStellarWind(4 * SolarMass, SolarRadius, astronomicalUnitToMeters(1));

        expect(massive.speed).toBe(2 * solar.speed);
        expect(massive.protonNumberDensity).toBeCloseTo(solar.protonNumberDensity / 2);
    });
});

describe("getStellarWindDynamicPressure", () => {
    it("estimates the solar wind dynamic pressure in the vicinity of Earth", () => {
        const pressure = getStellarWindDynamicPressure(solarWind);
        expect(pressure / 1.338e-9).toBeCloseTo(1);
    });
});

describe("getMagnetopauseStandoffDistance", () => {
    it("estimates the magnetopause standoff distance for Earth", () => {
        const magnetopauseStandoffDistance = getMagnetopauseStandoffDistance(
            EarthMagneticDipoleMoment,
            getStellarWindDynamicPressure(solarWind),
        );

        expect(magnetopauseStandoffDistance / 6.45e7).toBeCloseTo(1);
    });
});

describe("getDipoleFieldLineLatitude", () => {
    it("predicts the latitude at which Earth's magnetopause standoff distance field line will intersect the atmosphere", () => {
        const magnetopauseStandoffDistance = 6.45e7;
        const latitude = getDipoleFieldLineLatitude(magnetopauseStandoffDistance, earthRadius);
        expect(latitude).toBeCloseTo(degreesToRadians(71.69));
    });
});

describe("getDipoleFieldLineLatitude", () => {
    it("returns zero for a field line reaching the equator at the surface", () => {
        const latitude = getDipoleFieldLineLatitude(earthRadius, earthRadius);
        expect(latitude).toBeCloseTo(0);
    });

    it("returns 60 degrees for a field line extending to 4 planetary radii", () => {
        const latitude = getDipoleFieldLineLatitude(4 * earthRadius, earthRadius);
        expect(latitude).toBeCloseTo(Math.PI / 3);
    });
});

describe("getPolarCapLatitude", () => {
    it("estimates Earth's polar cap boundary latitude", () => {
        const latitude = getPolarCapLatitude(earthRadius, EarthMagneticDipoleMoment, solarWind);
        expect(latitude).toBeCloseTo(degreesToRadians(71.69));
    });
});
