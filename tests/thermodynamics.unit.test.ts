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

import {
    getRadiatedEnergyFlux,
    getSphereRadiatedEnergyFlux,
    getSphereTotalRadiatedEnergy
} from "../src/ts/utils/thermodynamic";

describe('Stefan-Boltzmann Law Functions', () => {

    test('getRadiatedEnergyFlux should calculate the energy flux correctly', () => {
        const temperature = 300; // in Kelvin
        const expectedFlux = 5.67e-8 * temperature ** 4;
        const flux = getRadiatedEnergyFlux(300);
        expect(flux).toBeCloseTo(expectedFlux, 5);
    });

    test('getSphereTotalRadiatedEnergy should calculate the total radiated energy correctly', () => {
        const temperature = 5778; // in Kelvin
        const radius = 6.9634e8; // in meters
        const expectedTotalEnergy = 5.67e-8 * temperature ** 4 * 4 * Math.PI * radius ** 2;
        const totalEnergy = getSphereTotalRadiatedEnergy(temperature, radius);
        expect(totalEnergy).toBeCloseTo(expectedTotalEnergy, 5);
    });

    test('getSphereRadiatedEnergyFlux should calculate the radiated energy flux at a distance correctly', () => {
        const temperatureSun = 5778; // in Kelvin
        const radiusSun = 6.9634e8; // in meters
        const distanceSun = 1.496e11; // in meters
        const expectedFluxAtDistance = 1360; // in W/m^2
        const fluxAtDistance = getSphereRadiatedEnergyFlux(temperatureSun, radiusSun, distanceSun);
        expect(fluxAtDistance).toBeGreaterThanOrEqual(expectedFluxAtDistance - 100);
        expect(fluxAtDistance).toBeLessThanOrEqual(expectedFluxAtDistance + 100);
    });

});