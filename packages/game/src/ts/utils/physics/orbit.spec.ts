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

import { describe, expect, it } from "vitest";

import {
    computeLpFactor,
    getEccentricity,
    getOrbitalPeriod,
    getOrbitRadiusFromPeriod,
    getSemiMajorAxis,
    getSemiMajorAxisFromPeriod,
    keplerEquation,
} from "./orbit";

describe("getSemiMajorAxis", () => {
    it("should average periapsis and apoapsis", () => {
        const periapsis = 100_000;
        const apoapsis = 300_000;
        expect(getSemiMajorAxis(periapsis, apoapsis)).toBe(200_000);
    });

    it("should return periapsis for circular orbits", () => {
        const periapsis = 150_000;
        expect(getSemiMajorAxis(periapsis, periapsis)).toBe(periapsis);
    });
});

describe("getEccentricity", () => {
    it("should compute eccentricity for an elliptical orbit", () => {
        const periapsis = 147_100_000_000; // Earth at perihelion (m)
        const apoapsis = 152_100_000_000; // Earth at aphelion (m)
        const eccentricity = getEccentricity(periapsis, apoapsis);
        expect(eccentricity).toBeCloseTo(0.0167, 4);
    });

    it("should return zero for a circular orbit", () => {
        expect(getEccentricity(50_000, 50_000)).toBe(0);
    });
});

describe("keplerEquation", () => {
    it("should be satisfied for matching anomalies", () => {
        const trueAnomaly = 1.2;
        const eccentricity = 0.25;
        const meanAnomaly = trueAnomaly - eccentricity * Math.sin(trueAnomaly);
        expect(keplerEquation(trueAnomaly, meanAnomaly, eccentricity)).toBeCloseTo(0, 10);
    });

    it("should return zero when anomalies are zero", () => {
        expect(keplerEquation(0, 0, 0.5)).toBe(0);
    });
});

describe("computeLpFactor", () => {
    it("should match the Euclidean norm for p = 2", () => {
        expect(computeLpFactor(1, 0, 2)).toBe(1);
        expect(computeLpFactor(1, 1, 2)).toBeCloseTo(1 / Math.sqrt(2));
    });

    it("should handle the rectangular norm", () => {
        expect(computeLpFactor(2, 1, 1)).toBe(1 / 3);
    });
});

describe("getOrbitalPeriod", () => {
    it("should return zero when the parent mass is zero", () => {
        expect(getOrbitalPeriod(1_000_000, 0)).toBe(0);
    });

    it("should compute the Earth year from the semi-major axis", () => {
        const semiMajorAxis = 1.496e11; // meters
        const sunMass = 1.989e30; // kg
        const orbitalPeriod = getOrbitalPeriod(semiMajorAxis, sunMass);
        const earthYearInSeconds = 365.25 * 24 * 60 * 60;
        expect(orbitalPeriod).toBeGreaterThan(earthYearInSeconds * 0.99);
        expect(orbitalPeriod).toBeLessThan(earthYearInSeconds * 1.01);
    });
});

describe("getSemiMajorAxisFromPeriod", () => {
    it("should return zero when the parent mass is zero", () => {
        expect(getSemiMajorAxisFromPeriod(60, 0)).toBe(0);
    });

    it("should invert getOrbitalPeriod for Earth", () => {
        const sunMass = 1.989e30; // kg
        const earthPeriod = 365.25 * 24 * 60 * 60; // seconds
        const semiMajorAxis = getSemiMajorAxisFromPeriod(earthPeriod, sunMass);
        expect(semiMajorAxis).toBeGreaterThan(1.49e11 - 1e9);
        expect(semiMajorAxis).toBeLessThan(1.49e11 + 1e9);
    });
});

describe("getOrbitRadiusFromPeriod", () => {
    it("should match the Earth's orbital radius", () => {
        const sunMass = 1.989e30; // in kg
        const earthPeriod = 365.25 * 24 * 60 * 60; // in seconds
        const earthOrbitRadius = getOrbitRadiusFromPeriod(earthPeriod, sunMass);

        expect(earthOrbitRadius).toBeGreaterThan(1.49e11 - 1e9);
        expect(earthOrbitRadius).toBeLessThan(1.49e11 + 1e9);
    });

    it("should match the Moon's orbital radius", () => {
        const earthMass = 5.972e24;
        const moonPeriod = 27.3 * 24 * 60 * 60; // in seconds
        const moonOrbitRadius = getOrbitRadiusFromPeriod(moonPeriod, earthMass);

        expect(moonOrbitRadius).toBeGreaterThan(3.84e8 - 2e6);
        expect(moonOrbitRadius).toBeLessThan(3.84e8 + 2e6);
    });
});
