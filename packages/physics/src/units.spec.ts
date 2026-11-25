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

import type { Assert, StrictEqual } from "@cosmos-journeyer/typescript";
import { describe, expect, it } from "vitest";

import type { Meters, Quantity, Seconds, Watts } from "./units";
import { kelvin, kilograms, meters, quantity, radians, seconds, watts } from "./units";

// Compile-time tests: brands are phantom numbers, incompatible units are rejected,
// and native arithmetic erases brands (no dimensional consistency is enforced).

export type MetersIsBrandedQuantity = Assert<StrictEqual<Meters, Quantity<"m">>>;
export type QuantityIsAssignableToNumber = Assert<StrictEqual<Meters extends number ? true : false, true>>;

export const addedValue = meters(1) + seconds(2);
export const multipliedValue = meters(3) * kilograms(4);
export type AdditionErasesBrands = Assert<StrictEqual<typeof addedValue, number>>;
export type MultiplicationErasesBrands = Assert<StrictEqual<typeof multipliedValue, number>>;

/**
 * @param value A distance in meters.
 */
function acceptsMeters(value: Meters): void {
    expect(typeof value).toBe("number");
}

/**
 * @param value A duration in seconds.
 */
function acceptsSeconds(value: Seconds): void {
    expect(typeof value).toBe("number");
}

/**
 * @param value A power in watts.
 */
function acceptsWatts(value: Watts): void {
    expect(typeof value).toBe("number");
}

describe("units", () => {
    it("constructors preserve the native numeric value", () => {
        expect(meters(6_371e3)).toBe(6_371e3);
        expect(seconds(60)).toBe(60);
        expect(kilograms(5.972e24)).toBe(5.972e24);
        expect(kelvin(5778)).toBe(5778);
        expect(radians(Math.PI)).toBe(Math.PI);
        expect(watts(3.846e26)).toBe(3.846e26);
    });

    it("quantity() brands compound units", () => {
        const g = quantity<"m³/(kg·s²)">(6.6743e-11);
        expect(g).toBe(6.6743e-11);
        const typed: Quantity<"m³/(kg·s²)"> = g;
        expect(typed).toBe(6.6743e-11);
    });

    it("brands are phantom at runtime (serialization unchanged)", () => {
        expect(JSON.stringify({ radius: meters(6_371e3) })).toBe('{"radius":6371000}');
    });

    it("rejects incompatible units at compile time", () => {
        acceptsMeters(meters(1));
        acceptsSeconds(seconds(1));
        acceptsWatts(watts(1));

        // Quantities are assignable to native numbers.
        const asNumber: number = meters(1);
        expect(asNumber).toBe(1);

        // @ts-expect-error -- meters are not seconds
        acceptsSeconds(meters(1));

        // @ts-expect-error -- seconds are not meters
        acceptsMeters(seconds(1));

        // @ts-expect-error -- kelvins are not meters
        acceptsMeters(kelvin(1));

        // @ts-expect-error -- a plain number is not a branded quantity
        acceptsMeters(1);

        // @ts-expect-error -- different compound units are incompatible
        acceptsWatts(quantity<"m³/(kg·s²)">(6.6743e-11));
    });

    it("native arithmetic erases brands at compile time", () => {
        const sum = meters(1) + meters(2);
        // @ts-expect-error -- arithmetic erased the brand, this is not Meters anymore
        acceptsMeters(sum);
        const stillNumber: number = sum;
        expect(stillNumber).toBe(3);
    });
});
