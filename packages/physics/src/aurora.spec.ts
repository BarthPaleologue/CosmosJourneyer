import { describe, expect, it } from "vitest";

import {
    getDipoleFieldLineLatitude,
    getMagnetopauseStandoffDistance,
    getPolarCapLatitude,
    getStellarWindDynamicPressure,
} from "./aurora";
import type { LocalStellarWindModel } from "./aurora";
import { EarthMagneticDipoleMoment } from "./constants/astrophysics";
import { degreesToRadians } from "./unitConversions";

// values from https://hdrl.gsfc.nasa.gov/LWS_Space_Weather/ACE_description.html
const solarWind: LocalStellarWindModel = {
    speed: 400_000,
    protonNumberDensity: 5e6,
};
const earthRadius = 6_371e3;

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
