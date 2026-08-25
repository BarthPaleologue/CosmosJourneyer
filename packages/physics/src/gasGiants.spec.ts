//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { JupiterMass, JupiterRadius } from "./constants/astrophysics";
import { getCoolGasGiantRadiusFromMass } from "./gasGiants";

describe("getCoolGasGiantRadiusFromMass", () => {
    it("returns the calibrated radius for a one-Jupiter-mass gas giant", () => {
        expect(getCoolGasGiantRadiusFromMass(JupiterMass)).toBeCloseTo(0.96 * JupiterRadius);
    });

    it("matches representative values across the fitted cool gas giant mass range", () => {
        expect(getCoolGasGiantRadiusFromMass(0.1 * JupiterMass)).toBeCloseTo(0.55 * JupiterRadius);
        expect(getCoolGasGiantRadiusFromMass(0.3 * JupiterMass)).toBeCloseTo(0.795515027037941 * JupiterRadius);
        expect(getCoolGasGiantRadiusFromMass(10 * JupiterMass)).toBeCloseTo(0.97 * JupiterRadius);
    });

    it("captures the super-jovian radius peak before the curve turns over", () => {
        const oneJupiterMassRadius = getCoolGasGiantRadiusFromMass(JupiterMass);
        const threeJupiterMassRadius = getCoolGasGiantRadiusFromMass(3 * JupiterMass);
        const tenJupiterMassRadius = getCoolGasGiantRadiusFromMass(10 * JupiterMass);

        expect(threeJupiterMassRadius).toBeGreaterThan(oneJupiterMassRadius);
        expect(threeJupiterMassRadius).toBeGreaterThan(tenJupiterMassRadius);
    });

    it("increases from sub-saturn masses up to about jovian masses", () => {
        const r01 = getCoolGasGiantRadiusFromMass(0.1 * JupiterMass);
        const r03 = getCoolGasGiantRadiusFromMass(0.3 * JupiterMass);
        const r1 = getCoolGasGiantRadiusFromMass(JupiterMass);

        expect(r03).toBeGreaterThan(r01);
        expect(r1).toBeGreaterThan(r03);
    });
});
