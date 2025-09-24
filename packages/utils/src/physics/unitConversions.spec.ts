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

import { describe, expect, it, test } from "vitest";

import { LightYearInMeters } from "./constants";
import { celsiusToKelvin, kelvinToCelsius, metersToLightYears } from "./unitConversions";

test("celsiusToKelvin", () => {
    expect(celsiusToKelvin(0)).toBe(273.15);
    expect(celsiusToKelvin(100)).toBe(373.15);
    expect(celsiusToKelvin(-273.15)).toBe(0);
});

test("kelvinToCelsius", () => {
    expect(kelvinToCelsius(0)).toBe(-273.15);
    expect(kelvinToCelsius(273.15)).toBe(0);
    expect(kelvinToCelsius(373.15)).toBe(100);
});

describe("metersToLightYears", () => {
    it("converts 0 meters to 0 light years", () => {
        expect(metersToLightYears(0)).toBe(0);
    });

    it("converts 1 light year in meters to 1 light year", () => {
        expect(metersToLightYears(LightYearInMeters)).toBe(1);
    });

    it("converts 2 light years in meters to 2 light years", () => {
        expect(metersToLightYears(LightYearInMeters * 2)).toBe(2);
    });

    it("converts a small distance in meters", () => {
        const smallDistanceInMeters = 1000; // 1 kilometer
        expect(metersToLightYears(smallDistanceInMeters)).toBe(smallDistanceInMeters / LightYearInMeters);
    });

    it("converts a large distance in meters", () => {
        const largeDistanceInMeters = LightYearInMeters * 1000000; // A million light years in meters
        expect(metersToLightYears(largeDistanceInMeters)).toBe(1000000);
    });

    it("handles negative distances correctly", () => {
        expect(metersToLightYears(-LightYearInMeters)).toBe(-1);
    });
});
