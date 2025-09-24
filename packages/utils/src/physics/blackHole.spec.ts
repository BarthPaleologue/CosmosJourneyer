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

import { describe, expect, it } from "vitest";

import { getSchwarzschildRadius } from "./blackHole";

describe("getSchwarzschildRadius", () => {
    it("should be about 3km for the mass of our sun", () => {
        const solarMass = 1.989e30;
        const schwarzschildRadius = getSchwarzschildRadius(solarMass);

        expect(schwarzschildRadius).toBeGreaterThan(2.95e3);
        expect(schwarzschildRadius).toBeLessThan(3.05e3);
    });

    it("should be about the size of a grain of rice for earth mass", () => {
        const earthMass = 5.972e24;
        const schwarzschildRadius = getSchwarzschildRadius(earthMass);

        expect(schwarzschildRadius).toBeGreaterThan(8.85e-3);
        expect(schwarzschildRadius).toBeLessThan(8.95e-3);
    });
});
