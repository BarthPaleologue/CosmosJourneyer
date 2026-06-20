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

import { AU, C, LightYearInMeters, SolarMass } from "./constants";

export type Duration = Partial<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}>;

export function metersToLightYears(meters: number): number {
    return meters / LightYearInMeters;
}

export function lightYearsToMeters(lightYears: number): number {
    return lightYears * LightYearInMeters;
}

export function metersToLightSeconds(meters: number): number {
    return meters / C;
}

export function metersToLightMinutes(meters: number): number {
    return meters / (C * 60);
}

/**
 * Converts a duration to seconds.
 * @param duration The duration expressed in days, hours, minutes, and/or seconds.
 * @returns The duration in seconds.
 */
export function durationToSeconds(duration: Duration): number {
    const days = duration.days ?? 0;
    const hours = duration.hours ?? 0;
    const minutes = duration.minutes ?? 0;
    const seconds = duration.seconds ?? 0;

    return days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
}

/**
 * Converts a temperature in Celsius to Kelvin
 * @param celsius The temperature in Celsius
 * @returns The temperature in Kelvin
 */
export function celsiusToKelvin(celsius: number) {
    return celsius + 273.15;
}

/**
 * Converts a temperature in Kelvin to Celsius
 * @param kelvin The temperature in Kelvin
 * @returns The temperature in Celsius
 */
export function kelvinToCelsius(kelvin: number) {
    return kelvin - 273.15;
}

/**
 * @param distanceAU The distance in astronomical units (AU)
 * @returns The distance in meters
 */
export function astronomicalUnitToMeters(distanceAU: number): number {
    return distanceAU * AU;
}

/**
 * @param solarMasses The mass in solar masses.
 * @returns The mass in kilograms.
 */
export function solarMassToKg(solarMasses: number): number {
    return solarMasses * SolarMass;
}

/**
 * @param bar The pressure in bar
 * @returns The pressure in pascals (Pa)
 * @see https://en.wikipedia.org/wiki/Bar_(unit) for the conversion factor
 */
export function barToPascal(bar: number): number {
    return bar * 100_000; // 1 bar = 100,000 pascals
}

/**
 * Converts an angle from degrees to radians
 * @param degrees The angle in degrees
 * @returns The angle in radians
 */
export function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Converts an area from square kilometers to square meters
 * @param km2 The area in square kilometers
 * @returns The area in square meters
 */
export function km2ToM2(km2: number): number {
    return km2 * 1_000_000;
}

/**
 * Converts an area from hectares to square meters
 * @param hectares The area in hectares
 * @returns The area in square meters
 */
export function haToM2(hectares: number): number {
    return hectares * 10_000;
}

/**
 * Converts a quantity expressed per hectare to the equivalent quantity per square meter.
 * @param valuePerHa The quantity per hectare.
 * @returns The quantity per square meter.
 */
export function perHaToPerM2(valuePerHa: number): number {
    return valuePerHa / haToM2(1);
}

/**
 * Converts a speed from kilometers per hour to meters per second.
 * @param kilometersPerHour The speed in kilometers per hour.
 * @returns The speed in meters per second.
 */
export function kmhToMetersPerSecond(kilometersPerHour: number): number {
    return kilometersPerHour / 3.6;
}

/**
 * Converts an annual energy consumption in kilowatt-hours to an average power in watts.
 * @param kwhPerYear The energy consumption in kWh per year.
 * @returns The average power in watts.
 */
export function kwhPerYearToWatts(kwhPerYear: number): number {
    const hoursPerYear = 365 * 24;
    return (kwhPerYear * 1000) / hoursPerYear;
}
