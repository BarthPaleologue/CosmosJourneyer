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

import type { Brand } from "@cosmos-journeyer/typescript";

/**
 * A physical quantity: a native `number` branded with the SI unit it is expressed in.
 *
 * Brands are compile-time only: at runtime a quantity is a plain `number`, so serialization,
 * numerical precision, and performance are unchanged.
 *
 * IMPORTANT: native arithmetic (`+`, `-`, `*`, `/`, `Math.sqrt`, ...) erases brands. The result
 * of any arithmetic expression is a plain `number`, NOT a `Quantity`, and no dimensional
 * consistency is enforced. Re-apply a constructor (e.g. `meters(...)`) at the point where a
 * computed value is known to have a given unit. This is deliberate: we do not implement a
 * dimensional algebra system.
 *
 * Unit strings use SI notation: `·` for multiplication, `/` for division, and superscripts for
 * powers (e.g. `"m³/(kg·s²)"`, `"W/(m²·K⁴)"`).
 */
export type Quantity<U extends string> = Brand<number, `unit:${U}`>;

/** Distance in meters (SI base unit). */
export type Meters = Quantity<"m">;
/** Duration in seconds (SI base unit). */
export type Seconds = Quantity<"s">;
/** Duration in minutes (non-SI, accepted for use with the SI). */
export type Minutes = Quantity<"min">;
/** Mass in kilograms (SI base unit). */
export type Kilograms = Quantity<"kg">;
/** Thermodynamic temperature in kelvins (SI base unit). */
export type Kelvin = Quantity<"K">;
/** Plane angle in radians (dimensionless SI derived unit). */
export type Radians = Quantity<"rad">;
/** Distance in light years (non-SI, commonly used in astronomy). */
export type LightYears = Quantity<"ly">;
/** Power in watts. */
export type Watts = Quantity<"W">;
/** Pressure in pascals. */
export type Pascals = Quantity<"Pa">;
/** Energy in joules. */
export type Joules = Quantity<"J">;
/** Frequency in hertz. */
export type Hertz = Quantity<"Hz">;
/** Speed in meters per second. */
export type MetersPerSecond = Quantity<"m/s">;
/** Acceleration in meters per second squared. */
export type MetersPerSecondSquared = Quantity<"m/s²">;
/** Area in square meters. */
export type SquareMeters = Quantity<"m²">;
/** Volume in cubic meters. */
export type CubicMeters = Quantity<"m³">;
/** Irradiance / radiative flux in watts per square meter. */
export type WattsPerSquareMeter = Quantity<"W/m²">;
/** Density in kilograms per cubic meter. */
export type KilogramsPerCubicMeter = Quantity<"kg/m³">;
/** Mass flow rate in kilograms per second. */
export type KilogramsPerSecond = Quantity<"kg/s">;
/** Number density in particles per cubic meter. */
export type PerCubicMeter = Quantity<"1/m³">;
/** Magnetic dipole moment in ampere square meters. */
export type AmpereSquareMeters = Quantity<"A·m²">;

/**
 * Applies a brand tag to a native value. This is the single place where a brand is materialized.
 * @param value The native value to brand.
 * @returns The branded value.
 */
function brand<T, B extends PropertyKey>(value: T): Brand<T, B> {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion -- Branded-type constructor: this factory is the single place applying a unit brand to a native number.
    return value as Brand<T, B>;
}

/**
 * Brands a native number as a quantity of the given (possibly compound) unit.
 * Use this for exotic compound units that have no named type, e.g. `quantity<"m³/(kg·s²)">(...)`.
 * @param value The numeric value in the given unit.
 * @returns The value branded as `Quantity<U>`.
 */
export function quantity<U extends string>(value: number): Quantity<U> {
    return brand(value);
}

/**
 * @param value Distance in meters.
 * @returns The value branded as {@link Meters}.
 */
export function meters(value: number): Meters {
    return quantity(value);
}

/**
 * @param value Duration in seconds.
 * @returns The value branded as {@link Seconds}.
 */
export function seconds(value: number): Seconds {
    return quantity(value);
}

/**
 * @param value Duration in minutes.
 * @returns The value branded as {@link Minutes}.
 */
export function minutes(value: number): Minutes {
    return quantity(value);
}

/**
 * @param value Mass in kilograms.
 * @returns The value branded as {@link Kilograms}.
 */
export function kilograms(value: number): Kilograms {
    return quantity(value);
}

/**
 * @param value Temperature in kelvins.
 * @returns The value branded as {@link Kelvin}.
 */
export function kelvin(value: number): Kelvin {
    return quantity(value);
}

/**
 * @param value Angle in radians.
 * @returns The value branded as {@link Radians}.
 */
export function radians(value: number): Radians {
    return quantity(value);
}

/**
 * @param value Distance in light years.
 * @returns The value branded as {@link LightYears}.
 */
export function lightYears(value: number): LightYears {
    return quantity(value);
}

/**
 * @param value Power in watts.
 * @returns The value branded as {@link Watts}.
 */
export function watts(value: number): Watts {
    return quantity(value);
}

/**
 * @param value Pressure in pascals.
 * @returns The value branded as {@link Pascals}.
 */
export function pascals(value: number): Pascals {
    return quantity(value);
}

/**
 * @param value Energy in joules.
 * @returns The value branded as {@link Joules}.
 */
export function joules(value: number): Joules {
    return quantity(value);
}

/**
 * @param value Frequency in hertz.
 * @returns The value branded as {@link Hertz}.
 */
export function hertz(value: number): Hertz {
    return quantity(value);
}

/**
 * @param value Speed in meters per second.
 * @returns The value branded as {@link MetersPerSecond}.
 */
export function metersPerSecond(value: number): MetersPerSecond {
    return quantity(value);
}

/**
 * @param value Acceleration in meters per second squared.
 * @returns The value branded as {@link MetersPerSecondSquared}.
 */
export function metersPerSecondSquared(value: number): MetersPerSecondSquared {
    return quantity(value);
}

/**
 * @param value Area in square meters.
 * @returns The value branded as {@link SquareMeters}.
 */
export function squareMeters(value: number): SquareMeters {
    return quantity(value);
}

/**
 * @param value Volume in cubic meters.
 * @returns The value branded as {@link CubicMeters}.
 */
export function cubicMeters(value: number): CubicMeters {
    return quantity(value);
}

/**
 * @param value Flux in watts per square meter.
 * @returns The value branded as {@link WattsPerSquareMeter}.
 */
export function wattsPerSquareMeter(value: number): WattsPerSquareMeter {
    return quantity(value);
}

/**
 * @param value Density in kilograms per cubic meter.
 * @returns The value branded as {@link KilogramsPerCubicMeter}.
 */
export function kilogramsPerCubicMeter(value: number): KilogramsPerCubicMeter {
    return quantity(value);
}

/**
 * @param value Mass flow rate in kilograms per second.
 * @returns The value branded as {@link KilogramsPerSecond}.
 */
export function kilogramsPerSecond(value: number): KilogramsPerSecond {
    return quantity(value);
}

/**
 * @param value Number density in particles per cubic meter.
 * @returns The value branded as {@link PerCubicMeter}.
 */
export function perCubicMeter(value: number): PerCubicMeter {
    return quantity(value);
}

/**
 * @param value Magnetic dipole moment in ampere square meters.
 * @returns The value branded as {@link AmpereSquareMeters}.
 */
export function ampereSquareMeters(value: number): AmpereSquareMeters {
    return quantity(value);
}
