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

import { computeMieRGB, EARTH_MARINE_SALT, MARS_DUST, TITAN_THOLIN, VENUS_SA_MODE2 } from "./mieScattering";

describe("Mie model – unit checks in SI", () => {
    it("Earth marine aerosol ≈ 70 Mm⁻¹ @ 550 nm (7e‑5 m⁻¹)", () => {
        const { betaSca } = computeMieRGB(EARTH_MARINE_SALT);
        const betaG = betaSca[1]; // λ = 550 nm
        expect(betaG).toBeGreaterThan(5e-5); // 50 Mm⁻¹
        expect(betaG).toBeLessThan(9e-5); // 90 Mm⁻¹
    });

    it("Mars dust ≈ 150 Mm⁻¹ @ 550 nm (1.5e‑4 m⁻¹)", () => {
        const { betaSca } = computeMieRGB(MARS_DUST);
        const betaG = betaSca[1];
        expect(betaG).toBeGreaterThan(1.0e-4); // 100 Mm⁻¹
        expect(betaG).toBeLessThan(2.0e-4); // 200 Mm⁻¹
    });

    it("Venus cloud mode‑2 ≈ 40 Mm⁻¹ @ 550 nm", () => {
        const betaG = computeMieRGB(VENUS_SA_MODE2).betaSca[1];
        expect(betaG).toBeGreaterThan(2.0e-5); // 20 Mm⁻¹
        expect(betaG).toBeLessThan(6.0e-5); // 60 Mm⁻¹
    });

    it("Titan tholin haze ≈ 170 Mm⁻¹ @ 550 nm", () => {
        const betaG = computeMieRGB(TITAN_THOLIN).betaSca[1];
        expect(betaG).toBeGreaterThan(1.2e-4); // 120 Mm⁻¹
        expect(betaG).toBeLessThan(2.5e-4); // 250 Mm⁻¹
    });
});
