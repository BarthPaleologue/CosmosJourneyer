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

import { computeAtmospherePressureScaleHeight, getHeightForPressure } from "./scaleHeight";

const relErr = (calc: number, ref: number) => Math.abs(calc - ref) / ref;

describe("computeAtmospherePressureScaleHeight", () => {
    it("should compute Earth's pressure scale height within 5%", () => {
        const temperature = 288; // K
        const gravity = 9.81; // m/s²
        const meanMolecularWeight = 0.02897; // kg/mol (28.97 g/mol)

        const prediction = computeAtmospherePressureScaleHeight(temperature, gravity, meanMolecularWeight);
        const groundTruth = 8.4e3; // 8.4 km = 8400 m

        expect(relErr(prediction, groundTruth)).toBeLessThan(0.05);
        expect(prediction / 1000).toBeCloseTo(8.4, 1); // in km, rounded to 1 decimal point
    });
    it("should compute Mars's pressure scale height within 5%", () => {
        const temperature = 210; // K
        const gravity = 3.71; // m/s²
        const meanMolecularWeight = 0.04334; // kg/mol (43.34 g/mol)

        const prediction = computeAtmospherePressureScaleHeight(temperature, gravity, meanMolecularWeight);
        const groundTruth = 11.2e3; // 11.2 km = 11200 m

        expect(relErr(prediction, groundTruth)).toBeLessThan(0.05);
        expect(prediction / 1000).toBeCloseTo(10.9, 1); // in km, rounded to 1 decimal point
    });
    it("should compute Titan's pressure scale height within 22%", () => {
        const temperature = 94; // K
        const gravity = 1.35; // m/s²
        const meanMolecularWeight = 0.028; // kg/mol (28.0 g/mol)

        const prediction = computeAtmospherePressureScaleHeight(temperature, gravity, meanMolecularWeight);
        const groundTruth = 17.0e3; // 17.0 km = 17000 m

        // Allow for a larger tolerance as Titan's atmosphere has a wider range of observed scale heights (15-50 km)
        expect(relErr(prediction, groundTruth)).toBeLessThan(0.22);
        expect(prediction / 1000).toBeGreaterThan(15.0); // at least 15 km
        expect(prediction / 1000).toBeLessThan(25.0); // below 25 km (lower stratosphere)
    });
    it("should compute Venus's pressure scale height within 5%", () => {
        const temperature = 737; // K (average surface temperature)
        const gravity = 8.87; // m/s²
        const meanMolecularWeight = 0.04345; // kg/mol (43.45 g/mol, mostly CO2)

        const prediction = computeAtmospherePressureScaleHeight(temperature, gravity, meanMolecularWeight);
        const groundTruth = 15.9e3; // 15.9 km = 15900 m

        expect(relErr(prediction, groundTruth)).toBeLessThan(0.05);
        expect(prediction / 1000).toBeCloseTo(15.9, 1); // in km, rounded to 1 decimal point
    });
    it("should compute Jupiter's pressure scale height within 15%", () => {
        const temperature = 165; // K
        const gravity = 25.92; // m/s²
        const meanMolecularWeight = 0.00222; // kg/mol (2.22 g/mol, mostly H2) see https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html

        const prediction = computeAtmospherePressureScaleHeight(temperature, gravity, meanMolecularWeight);
        const groundTruth = 27.0e3; // 27.0 km = 27000 m see https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html

        expect(relErr(prediction, groundTruth)).toBeLessThan(0.15);
    });
});

describe("getHeightForPressure", () => {
    it("should compute height for pressure on Earth", () => {
        const targetPressure = 101325; // Pa (sea level)
        const reference = { pressure: 101325, height: 0 }; // sea level
        const scaleHeight = 8400; // m

        const height = getHeightForPressure(targetPressure, reference, scaleHeight);
        expect(height).toBeCloseTo(0, 1); // should be close to sea level
    });

    it("should compute height for pressure on Mars", () => {
        const targetPressure = 610; // Pa (average surface pressure)
        const reference = { pressure: 610, height: 0 }; // Mars surface
        const scaleHeight = 11200; // m

        const height = getHeightForPressure(targetPressure, reference, scaleHeight);
        expect(height).toBeCloseTo(0, 1); // should be close to Mars surface
    });

    it("should predict Earth's Karmann line at 100 km", () => {
        const targetPressure = 3.2e-2; // Pa (Kármán line, 100 km) see https://www.pdas.com/bigtables.html (Table 1, Z=100km)
        const reference = { pressure: 101_325, height: 0 }; // sea level
        const scaleHeight = 8_400; // m

        const height = getHeightForPressure(targetPressure, reference, scaleHeight);
        const groundTruth = 100_000; // 100 km in meters
        expect(height).toBeGreaterThan(groundTruth); // approximation should always be above ground truth for atmosphere heights
        expect(Math.abs(height - groundTruth)).toBeLessThan(30_000);
    });
});
