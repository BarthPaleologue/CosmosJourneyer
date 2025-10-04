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

import { C, G, SolarMass, SolarRadius } from "./constants";
import { celsiusToKelvin } from "./unitConversions";

/**
 * Calculates the boiling point of water at a given pressure.
 * @param pressure The pressure of the atmosphere in pascal.
 * @returns The boiling point of water at the given pressure in Kelvin
 * @see https://en.wikipedia.org/wiki/Boiling_point?oldformat=true#Saturation_temperature_and_pressure
 * @see https://www.omnicalculator.com/chemistry/boiling-point
 * @see https://www.desmos.com/calculator/ctxerbh48s
 */
export function waterBoilingTemperature(pressure: number): number {
    const P1 = 101325.0; // sea level pressure on Earth in pascal
    const P2 = pressure;
    const T1 = celsiusToKelvin(100.0); // boiling point of water at sea level on Earth in Kelvin
    const DH = 40660.0;
    const R = 8.314;
    if (P2 <= 0.0) return 0.0; // when pressure is 0, water cannot exist in liquid state
    return 1.0 / (1.0 / T1 + Math.log(P1 / P2) * (R / DH));
}

/**
 * Computes the mean temperature of a planet given the properties of its star and itself
 * @param starTemperature The temperature of the star in Kelvin
 * @param starRadius The radius of the star in meters
 * @param starDistance The distance between the planet and the star in meters
 * @param planetAlbedo The albedo of the planet (0 = black, 1 = white)
 * @param planetGreenHouseEffect The greenhouse effect of the planet (0 = none, 1 = total)
 * @returns The mean temperature of the planet in Kelvin
 */
export function computeMeanTemperature(
    starTemperature: number,
    starRadius: number,
    starDistance: number,
    planetAlbedo: number,
    planetGreenHouseEffect: number,
) {
    return (
        starTemperature *
        Math.pow(((1 - planetAlbedo) * starRadius ** 2) / (4 * (1 - planetGreenHouseEffect) * starDistance ** 2), 0.25)
    );
}

/**
 * Returns an estimate of the radius of a star given its mass. This is only an approximation!
 * This can be used to estimate the angular momentum of a black hole.
 * @param mass The mass of the object in kg
 * @returns The estimated radius of the object in meters
 * @see https://en.wikipedia.org/wiki/Main_sequence#Sample_parameters
 */
export function estimateStarRadiusFromMass(mass: number) {
    const massInSolarUnits = mass / SolarMass;

    const estimatedRadiusInSolarUnits = Math.pow(massInSolarUnits, 0.78);

    return estimatedRadiusInSolarUnits * SolarRadius;
}

/**
 * Returns the minimal distance from an object at which the gravitational lensing effect becomes visible and eventually usable for magnification.
 * @param mass The mass of the object in kg
 * @param radius The radius of the object in meters
 * @returns The computed distance in meters
 * @see https://astronomy.stackexchange.com/questions/33498/what-is-the-gravitational-lensing-focal-distance-of-a-white-dwarf-star
 */
export function getGravitationalLensFocalDistance(mass: number, radius: number) {
    return (C * radius) ** 2 / (4 * G * mass);
}

/**
 * Compute the rotation period for a ring of given radius to simulate a given gravity.
 * @param radius The radius of the ring in meters
 * @param gravity The gravity to simulate at the inner surface of the ring in m/s²
 */
export function getRotationPeriodForArtificialGravity(radius: number, gravity: number): number {
    // g = v² / r and T = 2 * pi * r / v => v = sqrt(g * r) and T = 2 * pi * r / sqrt(g * r) = 2 * pi * sqrt(r / g)
    return 2 * Math.PI * Math.sqrt(radius / gravity);
}

/**
 * Determines if the temperature range of a planet overlaps with the liquid water range given its pressure
 * @param pressure The pressure of the atmosphere in pascal
 * @param minTemperature The minimum temperature of the planet in Kelvin
 * @param maxTemperature The maximum temperature of the planet in Kelvin
 */
export function hasLiquidWater(pressure: number, minTemperature: number, maxTemperature: number): boolean {
    const waterBoilingPoint = waterBoilingTemperature(pressure);
    const waterFreezingPoint = celsiusToKelvin(0);
    const epsilon = 0.05;

    // if pressure is too low, there is no ocean (airless world)
    if (pressure < epsilon) return false;

    // if boiling point is lower than freezing point, ice sublimates instead of melting
    if (waterBoilingPoint < waterFreezingPoint) return false;

    // if temperature is too high, there is no ocean (desert world)
    if (minTemperature > waterBoilingPoint) return false;

    // if temperature is too low, there is no ocean (frozen world)
    if (maxTemperature < waterFreezingPoint) return false;

    return true;
}

/**
 * Returns the apparent gravity on a space tether given its period, mass and distance
 * @param period The rotation period of the tether in seconds (typically the same as the parent object for a classic space elevator)
 * @param mass The mass of the parent object in kilograms
 * @param distance The distance to the center of the parent object in meters
 * @see https://en.wikipedia.org/wiki/Space_elevator#Apparent_gravitational_field
 */
export function getApparentGravityOnSpaceTether(period: number, mass: number, distance: number) {
    const omega = (2 * Math.PI) / period;
    return (-G * mass) / (distance * distance) + distance * omega * omega;
}
