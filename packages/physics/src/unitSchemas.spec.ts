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
import { z } from "zod";

import type { Kelvin, Meters, Radians, Seconds } from "./units";
import { meters, radians, seconds } from "./units";
import { KelvinSchema, MetersSchema, RadiansSchema, SecondsSchema } from "./unitSchemas";

// Compile-time tests: unit schemas parse plain numbers into branded quantities.

export type MetersSchemaOutputsMeters = Assert<StrictEqual<z.infer<typeof MetersSchema>, Meters>>;
export type KelvinSchemaOutputsKelvin = Assert<StrictEqual<z.infer<typeof KelvinSchema>, Kelvin>>;
export type RadiansSchemaOutputsRadians = Assert<StrictEqual<z.infer<typeof RadiansSchema>, Radians>>;
export type SecondsSchemaOutputsSeconds = Assert<StrictEqual<z.infer<typeof SecondsSchema>, Seconds>>;
export type MetersSchemaAcceptsPlainNumbers = Assert<StrictEqual<z.input<typeof MetersSchema>, number>>;

describe("unit schemas", () => {
    it("parse plain numbers into branded quantities", () => {
        const parsedMeters: Meters = MetersSchema.parse(6_371e3);
        expect(parsedMeters).toBe(6_371e3);

        const parsedKelvin: Kelvin = KelvinSchema.parse(5778);
        expect(parsedKelvin).toBe(5778);
    });

    it("preserve the serialized format (plain numbers on the wire)", () => {
        const schema = z.object({ radius: MetersSchema, period: SecondsSchema, tilt: RadiansSchema });

        const data = { radius: 6_371e3, period: 86164.1, tilt: 0.4 };
        const serialized = JSON.stringify(data);

        const parsed = schema.parse(JSON.parse(serialized));
        expect(parsed.radius).toBe(6_371e3);
        expect(parsed.period).toBe(86164.1);
        expect(parsed.tilt).toBe(0.4);
        // Round-tripping through parse + serialize yields the exact same JSON.
        expect(JSON.stringify(parsed)).toBe(serialized);
    });

    it("preserve existing number validation behavior", () => {
        // Validation chains stay on the plain number, before the branding transform.
        const positiveMeters = z.number().positive().pipe(MetersSchema);
        expect(() => positiveMeters.parse(-1)).toThrow();
        const parsedPositive: Meters = positiveMeters.parse(1);
        expect(parsedPositive).toBe(1);

        const boundedKelvin = z.number().min(0).pipe(KelvinSchema);
        expect(() => boundedKelvin.parse(-5)).toThrow();
        const parsedBounded: Kelvin = boundedKelvin.parse(300);
        expect(parsedBounded).toBe(300);
    });

    it("supports defaults with branded values", () => {
        const schema = z.object({ tilt: RadiansSchema.default(radians(0)) });
        const parsed = schema.parse({});
        expect(parsed.tilt).toBe(0);
        const typed: Radians = parsed.tilt;
        expect(typed).toBe(0);
    });

    it("accepts branded values as input (they are numbers)", () => {
        expect(MetersSchema.parse(meters(42))).toBe(42);
        expect(SecondsSchema.parse(seconds(60))).toBe(60);
    });
});
