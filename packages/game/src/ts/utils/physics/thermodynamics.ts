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

import { StefanBoltzmannConstant } from "./constants";

/**
 * Applies Stefan-Boltzmann law to calculate the radiative flux of a black body.
 * @param temperatureKelvin The temperature of the black body in Kelvin.
 * @returns The radiative flux in W/m².
 */
export function getBlackBodyEmittedFlux(temperatureKelvin: number) {
    return StefanBoltzmannConstant * temperatureKelvin ** 4;
}

/**
 * Calculates the total radiated power (luminosity) of a blackbody sphere of a given radius and temperature (typically a star) using the Stefan-Boltzmann law.
 * @param temperatureKelvin The temperature of the sphere in Kelvin.
 * @param radius The radius of the sphere in meters.
 * @returns The total radiated power in Watts.
 */
export function getBlackBodyLuminosity(temperatureKelvin: number, radius: number) {
    return getBlackBodyEmittedFlux(temperatureKelvin) * 4 * Math.PI * radius ** 2;
}

/**
 * Calculates the irradiance (received radiative power per unit area)
 * at a given distance from a blackbody sphere assuming isotropic emission.
 * Assumes distance is large compared to the radius of the sphere.
 * @param temperatureKelvin The surface temperature of the sphere in Kelvin.
 * @param radius The radius of the sphere in meters.
 * @param distance The distance from the sphere center in meters.
 * @returns The irradiance in W/m² at the given distance.
 */
export function getSphereIrradianceAtDistance(temperatureKelvin: number, radius: number, distance: number) {
    return getBlackBodyLuminosity(temperatureKelvin, radius) / (4 * Math.PI * distance ** 2);
}
