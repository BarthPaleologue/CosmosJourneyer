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
    estimateBlackHoleAngularMomentum,
    getErgosphereRadius,
    getKerrMetricA,
    getMassFromSchwarzschildRadius,
    getSchwarzschildRadius,
    hasNakedSingularity,
} from "./blackHole";
import { C, G, SolarMass, SolarRadius } from "./constants";

const cygnusX1Mass = 21.2 * SolarMass; // Miller-Jones et al. 2021, 21.2 ± 2.2 M☉
const cygnusX1Spin = 0.95; // Dimensionless spin parameter a* ≳ 0.95

const sagittariusAMass = 4.297e6 * SolarMass; // Gravity Collaboration 2019, 4.297 ± 0.012 × 10^6 M☉
const sagittariusASpin = 0.1; // Low spin estimates from GRAVITY+EHT joint analyses

const rotationPeriodFromSpin = (mass: number, dimensionlessSpin: number) => {
    if (dimensionlessSpin === 0) return Infinity;

    const estimatedRadius = Math.pow(mass / SolarMass, 0.78) * SolarRadius;
    return (((4 * Math.PI) / 5) * estimatedRadius ** 2 * C) / (dimensionlessSpin * G * mass);
};

describe("getSchwarzschildRadius", () => {
    it("should be about 3km for the mass of our sun", () => {
        const solarMass = 1.989e30;
        const schwarzschildRadius = getSchwarzschildRadius(solarMass);

        expect(schwarzschildRadius).toBeGreaterThan(2.95e3);
        expect(schwarzschildRadius).toBeLessThan(3.05e3);
    });

    it("should be about the size of a grain of rice for earth mass", () => {
        const earthMass = 5.972e24;
        const schwarzschildRadius = getSchwarzschildRadius(earthMass);

        expect(schwarzschildRadius).toBeGreaterThan(8.85e-3);
        expect(schwarzschildRadius).toBeLessThan(8.95e-3);
    });
});

describe("getMassFromSchwarzschildRadius", () => {
    it("inverts getSchwarzschildRadius", () => {
        const solarMass = SolarMass;
        const radius = getSchwarzschildRadius(solarMass);
        expect(getMassFromSchwarzschildRadius(radius)).toBeCloseTo(solarMass, 6);
    });

    it("handles kilometer-sized radius", () => {
        const radius = 1_000;
        const expectedMass = (radius * C ** 2) / (2 * G);
        expect(getMassFromSchwarzschildRadius(radius)).toBeCloseTo(expectedMass, 6);
    });
});

describe("estimateBlackHoleAngularMomentum", () => {
    it("returns zero when rotation period is zero", () => {
        const mass = SolarMass;
        expect(estimateBlackHoleAngularMomentum(mass, 0)).toBe(0);
    });

    it("matches Cygnus X-1 angular momentum estimate", () => {
        const rotationPeriod = rotationPeriodFromSpin(cygnusX1Mass, cygnusX1Spin);
        const expectedAngularMomentum = (cygnusX1Spin * G * cygnusX1Mass * cygnusX1Mass) / C;

        expect(estimateBlackHoleAngularMomentum(cygnusX1Mass, rotationPeriod)).toBeCloseTo(expectedAngularMomentum, 6);
    });
});

describe("getKerrMetricA", () => {
    it("reproduces Cygnus X-1 Kerr parameter", () => {
        const rotationPeriod = rotationPeriodFromSpin(cygnusX1Mass, cygnusX1Spin);
        const expectedA = (cygnusX1Spin * G * cygnusX1Mass) / C ** 2;

        expect(getKerrMetricA(cygnusX1Mass, rotationPeriod)).toBeCloseTo(expectedA, 6);
    });
});

describe("hasNakedSingularity", () => {
    it("accepts Sagittarius A* spin estimates", () => {
        const rotationPeriod = rotationPeriodFromSpin(sagittariusAMass, sagittariusASpin);

        expect(hasNakedSingularity(sagittariusAMass, rotationPeriod)).toBe(false);
    });

    it("flags overextreme solutions", () => {
        const estimatedRadius = Math.pow(sagittariusAMass / SolarMass, 0.78) * SolarRadius;
        const thresholdPeriod = (((4 * Math.PI) / 5) * estimatedRadius ** 2) / (sagittariusAMass * C);

        expect(hasNakedSingularity(sagittariusAMass, thresholdPeriod / 10)).toBe(true);
    });
});

describe("getErgosphereRadius", () => {
    it("returns twice the gravitational radius at the equator", () => {
        const rotationPeriod = rotationPeriodFromSpin(sagittariusAMass, sagittariusASpin);
        const m = (G * sagittariusAMass) / C ** 2;

        expect(getErgosphereRadius(sagittariusAMass, rotationPeriod, Math.PI / 2)).toBeCloseTo(2 * m, 6);
    });

    it("is smaller at the poles when rotating", () => {
        const rotationPeriod = rotationPeriodFromSpin(sagittariusAMass, sagittariusASpin);
        const m = (G * sagittariusAMass) / C ** 2;
        const a = getKerrMetricA(sagittariusAMass, rotationPeriod);
        const polarRadius = getErgosphereRadius(sagittariusAMass, rotationPeriod, 0);
        const expectedPolarRadius = m + Math.sqrt(m * m - a * a);
        expect(polarRadius).toBeCloseTo(expectedPolarRadius, 6);
        expect(polarRadius).toBeLessThan(2 * m);
    });

    it("throws when the solution is overextreme", () => {
        const rotationPeriod = rotationPeriodFromSpin(sagittariusAMass, sagittariusASpin) / 100;

        expect(() => getErgosphereRadius(sagittariusAMass, rotationPeriod, Math.PI / 3)).toThrowError();
    });
});
