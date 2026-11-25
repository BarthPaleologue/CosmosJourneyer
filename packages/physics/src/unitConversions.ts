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

import { C, LightYearInMeters, SolarMass } from "./constants";
import type {
    Kelvin,
    Kilograms,
    LightYears,
    Meters,
    MetersPerSecond,
    Minutes,
    Pascals,
    Radians,
    Seconds,
    SquareMeters,
    Watts,
} from "./units";
import {
    kelvin,
    kilograms,
    lightYears,
    meters,
    metersPerSecond,
    minutes,
    pascals,
    radians,
    seconds,
    squareMeters,
    watts,
} from "./units";

export type Duration = Partial<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}>;

/**
 * @param distance Distance in meters.
 * @returns Distance in light years.
 */
export function metersToLightYears(distance: Meters): LightYears {
    return lightYears(distance / LightYearInMeters);
}

/**
 * @param distance Distance in light years.
 * @returns Distance in meters.
 */
export function lightYearsToMeters(distance: LightYears): Meters {
    return meters(distance * LightYearInMeters);
}

/**
 * @param distance Distance in meters.
 * @returns Distance in light seconds.
 */
export function metersToLightSeconds(distance: Meters): Seconds {
    return seconds(distance / C);
}

/**
 * @param distance Distance in meters.
 * @returns Distance in light minutes.
 */
export function metersToLightMinutes(distance: Meters): Minutes {
    return minutes(distance / (C * 60));
}

/**
 * @param duration Duration expressed in days, hours, minutes, and/or seconds.
 * @returns Duration in seconds.
 */
export function durationToSeconds(duration: Readonly<Duration>): Seconds {
    const days = duration.days ?? 0;
    const hours = duration.hours ?? 0;
    const minutesPart = duration.minutes ?? 0;
    const secondsPart = duration.seconds ?? 0;

    return seconds(days * 24 * 60 * 60 + hours * 60 * 60 + minutesPart * 60 + secondsPart);
}

/**
 * @param celsius Temperature in degrees Celsius. Celsius degrees are treated as a plain count (affine scale), not a branded quantity.
 * @returns Temperature in kelvins.
 */
export function celsiusToKelvin(celsius: number): Kelvin {
    return kelvin(celsius + 273.15);
}

/**
 * @param temperature Temperature in kelvins.
 * @returns Temperature in degrees Celsius.
 */
export function kelvinToCelsius(temperature: Kelvin): number {
    return temperature - 273.15;
}

/**
 * @param distanceAU Distance in astronomical units (AU). AU counts are treated as a plain number (non-SI display unit).
 * @returns Distance in meters.
 */
export function astronomicalUnitToMeters(distanceAU: number): Meters {
    return meters(distanceAU * 150e9);
}

/**
 * @param solarMasses Mass in solar masses. Solar mass counts are treated as a plain number (non-SI display unit).
 * @returns Mass in kilograms.
 */
export function solarMassToKg(solarMasses: number): Kilograms {
    return kilograms(solarMasses * SolarMass);
}

/**
 * @param bar Pressure in bar. Bar counts are treated as a plain number (non-SI display unit).
 * @returns Pressure in pascals (Pa).
 * @see https://en.wikipedia.org/wiki/Bar_(unit) for the conversion factor
 */
export function barToPascal(bar: number): Pascals {
    return pascals(bar * 100_000); // 1 bar = 100,000 pascals
}

/**
 * Converts an angle from degrees to radians
 * @param degrees The angle in degrees. Degrees are dimensionless, so a plain number is used.
 * @returns The angle in radians
 */
export function degreesToRadians(degrees: number): Radians {
    return radians(degrees * (Math.PI / 180));
}

/**
 * Converts an area from square kilometers to square meters
 * @param km2 The area in square kilometers
 * @returns The area in square meters
 */
export function km2ToM2(km2: number): SquareMeters {
    return squareMeters(km2 * 1_000_000);
}

/**
 * Converts an area from hectares to square meters
 * @param hectares The area in hectares
 * @returns The area in square meters
 */
export function haToM2(hectares: number): SquareMeters {
    return squareMeters(hectares * 10_000);
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
export function kmhToMetersPerSecond(kilometersPerHour: number): MetersPerSecond {
    return metersPerSecond(kilometersPerHour / 3.6);
}

/**
 * Converts an annual energy consumption in kilowatt-hours to an average power in watts.
 * @param kwhPerYear The energy consumption in kWh per year.
 * @returns The average power in watts.
 */
export function kwhPerYearToWatts(kwhPerYear: number): Watts {
    const hoursPerYear = 365 * 24;
    return watts((kwhPerYear * 1000) / hoursPerYear);
}
