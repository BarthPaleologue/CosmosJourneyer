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

import { z } from "zod";

import type { Quantity } from "./units";
import {
    ampereSquareMeters,
    cubicMeters,
    hertz,
    joules,
    kelvin,
    kilograms,
    kilogramsPerCubicMeter,
    kilogramsPerSecond,
    lightYears,
    meters,
    metersPerSecond,
    metersPerSecondSquared,
    minutes,
    pascals,
    perCubicMeter,
    radians,
    seconds,
    squareMeters,
    watts,
    wattsPerSquareMeter,
} from "./units";

/**
 * Builds a Zod schema for a branded physical quantity.
 *
 * The schema validates a plain `number` on the wire, so serialized formats and existing
 * validation behavior (min/max/refine chains on `z.number()`) are unchanged; parsing then
 * transforms the value into the corresponding branded quantity.
 * @param constructor The explicit constructor that brands the unit (e.g. `meters`).
 * @returns A Zod schema whose output type is `Quantity<U>`.
 */
function unitSchema<U extends string>(constructor: (value: number) => Quantity<U>) {
    return z.number().transform(constructor);
}

/** Zod schema parsing a number of meters into {@link Meters}. */
export const MetersSchema = unitSchema(meters);
/** Zod schema parsing a number of seconds into {@link Seconds}. */
export const SecondsSchema = unitSchema(seconds);
/** Zod schema parsing a number of minutes into {@link Minutes}. */
export const MinutesSchema = unitSchema(minutes);
/** Zod schema parsing a number of kilograms into {@link Kilograms}. */
export const KilogramsSchema = unitSchema(kilograms);
/** Zod schema parsing a number of kelvins into {@link Kelvin}. */
export const KelvinSchema = unitSchema(kelvin);
/** Zod schema parsing a number of radians into {@link Radians}. */
export const RadiansSchema = unitSchema(radians);
/** Zod schema parsing a number of light years into {@link LightYears}. */
export const LightYearsSchema = unitSchema(lightYears);
/** Zod schema parsing a number of watts into {@link Watts}. */
export const WattsSchema = unitSchema(watts);
/** Zod schema parsing a number of pascals into {@link Pascals}. */
export const PascalsSchema = unitSchema(pascals);
/** Zod schema parsing a number of joules into {@link Joules}. */
export const JoulesSchema = unitSchema(joules);
/** Zod schema parsing a number of hertz into {@link Hertz}. */
export const HertzSchema = unitSchema(hertz);
/** Zod schema parsing a speed in meters per second into {@link MetersPerSecond}. */
export const MetersPerSecondSchema = unitSchema(metersPerSecond);
/** Zod schema parsing an acceleration in meters per second squared into {@link MetersPerSecondSquared}. */
export const MetersPerSecondSquaredSchema = unitSchema(metersPerSecondSquared);
/** Zod schema parsing an area in square meters into {@link SquareMeters}. */
export const SquareMetersSchema = unitSchema(squareMeters);
/** Zod schema parsing a volume in cubic meters into {@link CubicMeters}. */
export const CubicMetersSchema = unitSchema(cubicMeters);
/** Zod schema parsing a flux in watts per square meter into {@link WattsPerSquareMeter}. */
export const WattsPerSquareMeterSchema = unitSchema(wattsPerSquareMeter);
/** Zod schema parsing a density in kilograms per cubic meter into {@link KilogramsPerCubicMeter}. */
export const KilogramsPerCubicMeterSchema = unitSchema(kilogramsPerCubicMeter);
/** Zod schema parsing a mass flow rate in kilograms per second into {@link KilogramsPerSecond}. */
export const KilogramsPerSecondSchema = unitSchema(kilogramsPerSecond);
/** Zod schema parsing a number density in particles per cubic meter into {@link PerCubicMeter}. */
export const PerCubicMeterSchema = unitSchema(perCubicMeter);
/** Zod schema parsing a magnetic dipole moment in A·m² into {@link AmpereSquareMeters}. */
export const AmpereSquareMetersSchema = unitSchema(ampereSquareMeters);
