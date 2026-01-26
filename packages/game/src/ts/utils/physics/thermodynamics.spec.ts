import { describe, expect, it } from "vitest";

import { getBlackBodyEmittedFlux, getBlackBodyLuminosity, getSphereIrradianceAtDistance } from "./thermodynamics";

describe("Stefan-Boltzmann Law Functions", () => {
    describe("getBlackBodyEmittedFlux", () => {
        it("should calculate the energy flux correctly", () => {
            const temperature = 300; // in Kelvin
            const expectedFlux = 5.67e-8 * temperature ** 4;
            const flux = getBlackBodyEmittedFlux(300);
            expect(flux).toBeCloseTo(expectedFlux, 5);
        });
    });

    describe("getSphereTotalRadiatedPower", () => {
        it("should calculate the total radiated energy correctly", () => {
            const temperature = 5778; // in Kelvin
            const radius = 6.9634e8; // in meters
            const expectedTotalEnergy = 5.67e-8 * temperature ** 4 * 4 * Math.PI * radius ** 2;
            const totalEnergy = getBlackBodyLuminosity(temperature, radius);
            expect(totalEnergy).toBeCloseTo(expectedTotalEnergy, 5);
        });
    });

    describe("getSphereIrradianceAtDistance", () => {
        it("should calculate the radiated energy flux at a distance correctly", () => {
            const temperatureSun = 5778; // in Kelvin
            const radiusSun = 6.9634e8; // in meters
            const distanceSun = 1.496e11; // in meters
            const expectedFluxAtDistance = 1360; // in W/m^2
            const fluxAtDistance = getSphereIrradianceAtDistance(temperatureSun, radiusSun, distanceSun);
            expect(fluxAtDistance).toBeGreaterThanOrEqual(expectedFluxAtDistance - 100);
            expect(fluxAtDistance).toBeLessThanOrEqual(expectedFluxAtDistance + 100);
        });
    });
});
