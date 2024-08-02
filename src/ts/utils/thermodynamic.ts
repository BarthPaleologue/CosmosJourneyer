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

/**
 * Applies Stefan-Boltzmann law to calculate the energy flux of a black body.
 * @param temperatureKelvin The temperature of the black body in Kelvin.
 */
export function getRadiatedEnergyFlux(temperatureKelvin: number) {
    return 5.67e-8 * temperatureKelvin ** 4;
}

/**
 * Calculates the total radiated energy of a sphere of a given radius and temperature (typically a star) using the Stefan-Boltzmann law.
 * @param temperatureKelvin The temperature of the sphere in Kelvin.
 * @param radius The radius of the sphere in meters.
 */
export function getSphereTotalRadiatedEnergy(temperatureKelvin: number, radius: number) {
    return getRadiatedEnergyFlux(temperatureKelvin) * 4 * Math.PI * radius ** 2;
}

/**
 * Calculates the energy flux of received at a given distance from a sphere of a given radius and temperature (typically a star).
 * @param temperatureKelvin The temperature of the sphere in Kelvin.
 * @param radius The radius of the sphere in meters.
 * @param distance The distance from the sphere in meters.
 */
export function getSphereRadiatedEnergyFlux(temperatureKelvin: number, radius: number, distance: number) {
    return getSphereTotalRadiatedEnergy(temperatureKelvin, radius) / (4 * Math.PI * distance ** 2);
}
