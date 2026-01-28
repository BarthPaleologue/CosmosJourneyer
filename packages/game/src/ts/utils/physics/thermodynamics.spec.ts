import { describe, expect, it } from "vitest";

import {
    getBlackBodyLuminosity,
    getBlackBodyRadiatedFlux,
    getRadiatedFlux,
    getRadiatorAreaForHeat,
    getSphereIrradianceAtDistance,
} from "./thermodynamics";

describe("Stefan-Boltzmann Law Functions", () => {
    const expectedStefanBoltzmannConstant = 5.670374419e-8;

    describe("getBlackBodyRadiatedFlux", () => {
        it("should calculate the energy flux correctly", () => {
            const temperature = 300; // in Kelvin
            const expectedFlux = expectedStefanBoltzmannConstant * temperature ** 4;
            const flux = getBlackBodyRadiatedFlux(300);
            expect(flux).toBeCloseTo(expectedFlux, 5);
        });
    });

    describe("getSphereTotalRadiatedPower", () => {
        it("should calculate the total radiated energy correctly", () => {
            const temperature = 5778; // in Kelvin
            const radius = 6.9634e8; // in meters
            const expectedTotalEnergy = expectedStefanBoltzmannConstant * temperature ** 4 * 4 * Math.PI * radius ** 2;
            const totalEnergy = getBlackBodyLuminosity(temperature, radius);
            expect(totalEnergy / expectedTotalEnergy).toBeCloseTo(1, 10);
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

    describe("getRadiatedFlux", () => {
        it("should scale black body flux by emissivity", () => {
            const temperature = 450; // in Kelvin
            const emissivity = 0.6;
            const expectedFlux = getBlackBodyRadiatedFlux(temperature) * emissivity;
            expect(getRadiatedFlux(temperature, emissivity)).toBeCloseTo(expectedFlux, 8);
        });

        it("should return zero for a perfect reflector", () => {
            const temperature = 1200; // in Kelvin
            expect(getRadiatedFlux(temperature, 0)).toBe(0);
        });
    });

    describe("getRadiatorAreaForHeat", () => {
        it("should compute the single-sided area from flux", () => {
            const heatToDissipate = 1500; // in W
            const targetTemperature = 350; // in K
            const emissivity = 0.85;
            const radiatorFlux = getRadiatedFlux(targetTemperature, emissivity);
            const expectedArea = heatToDissipate / radiatorFlux;
            expect(getRadiatorAreaForHeat(heatToDissipate, targetTemperature, emissivity, false)).toBeCloseTo(
                expectedArea,
                8,
            );
        });

        it("should halve the area for double-sided radiators", () => {
            const heatToDissipate = 2000; // in W
            const targetTemperature = 400; // in K
            const emissivity = 0.9;
            const singleSidedArea = getRadiatorAreaForHeat(heatToDissipate, targetTemperature, emissivity, false);
            const doubleSidedArea = getRadiatorAreaForHeat(heatToDissipate, targetTemperature, emissivity, true);
            expect(doubleSidedArea).toBeCloseTo(singleSidedArea / 2, 8);
        });
    });
});
