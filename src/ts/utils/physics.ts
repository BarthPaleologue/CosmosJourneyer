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

import { Settings } from "../settings";

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

/**
 *
 * @param pressure
 * @see https://www.omnicalculator.com/chemistry/boiling-point
 * @see https://www.wikiwand.com/en/Boiling_point#/Saturation_temperature_and_pressure
 * @see https://www.desmos.com/calculator/ctxerbh48s
 */
export function waterBoilingPointCelsius(pressure: number): number {
    const P1 = 1.0;
    const P2 = pressure;
    const T1 = 100.0 + 273.15;
    const DH = 40660.0;
    const R = 8.314;
    if (P2 > 0.0) return 1.0 / (1.0 / T1 + Math.log(P1 / P2) * (R / DH)) - 273.15;
    return -273.15;
}

/**
 * Computes the mean temperature of a planet given the properties of its star and itself
 * @param starTemperature The temperature of the star
 * @param starRadius The radius of the star
 * @param starDistance The distance between the planet and the star
 * @param planetAlbedo The albedo of the planet
 * @param planetGreenHouseEffect The greenhouse effect of the planet
 */
export function computeMeanTemperature(starTemperature: number, starRadius: number, starDistance: number, planetAlbedo: number, planetGreenHouseEffect: number) {
    return starTemperature * Math.pow(((1 - planetAlbedo) * starRadius ** 2) / (4 * (1 - planetGreenHouseEffect) * starDistance ** 2), 0.25);
}

/**
 * Returns an estimate of the radius of a star given its mass. This is only an approximation!
 * This can be used to estimate the angular momentum of a black hole.
 * @param mass The mass of the object
 * @constructor
 * @see https://en.wikipedia.org/wiki/Main_sequence#Sample_parameters
 */
export function estimateStarRadiusFromMass(mass: number) {
    const massInSolarUnits = mass / Settings.SOLAR_MASS;

    const estimatedRadiusInSolarUnits = Math.pow(massInSolarUnits, 0.78);

    return estimatedRadiusInSolarUnits * Settings.SOLAR_RADIUS;
}

/**
 * Returns the minimal distance from an object at which the gravitational lensing effect becomes visible and eventually usable for magnification.
 * @param mass The mass of the object in kg
 * @param radius The radius of the object in meters
 * @returns The computed distance in meters
 * @see https://astronomy.stackexchange.com/questions/33498/what-is-the-gravitational-lensing-focal-distance-of-a-white-dwarf-star
 */
export function getGravitationalLensFocalDistance(mass: number, radius: number) {
    return (Settings.C * radius) ** 2 / (4 * Settings.G * mass);
}

/**
 * Compute the rotation period for a ring of given radius to simulate a given gravity.
 * @param radius The radius of the ring
 * @param gravity The gravity to simulate
 */
export function computeRingRotationPeriod(radius: number, gravity: number): number {
    // g = v * v / r and T = 2 * pi * r / v => v = sqrt(g * r) and T = 2 * pi * r / sqrt(g * r) = 2 * pi * sqrt(r / g)
    return 2 * Math.PI * Math.sqrt(radius / gravity);
}

export function hasLiquidWater(pressure: number, minTemperature: number, maxTemperature: number): boolean {
    const waterBoilingPoint = waterBoilingPointCelsius(pressure);
    const waterFreezingPoint = 0.0;
    const epsilon = 0.05;
    if (pressure > epsilon) {
        // if temperature is too high, there is no ocean (desert world)
        if (maxTemperature > waterBoilingPoint) return false;
        // if temperature is too low, there is no ocean (frozen world)
        if (maxTemperature < waterFreezingPoint) return false;
    } else {
        // if pressure is too low, there is no ocean (sterile world)
        return false;
    }

    return true;
}

/**
 * Returns the Schwarzschild radius of an object given its mass
 * @param mass The mass of the object in kilograms
 * @returns the Schwarzschild radius of the object in meters
 */
export function getSchwarzschildRadius(mass: number): number {
    return (2 * Settings.G * mass) / (Settings.C * Settings.C);
}