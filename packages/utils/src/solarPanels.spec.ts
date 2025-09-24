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

import { getSphereRadiatedEnergyFlux } from "./physics/thermodynamics";
import { getSolarPanelSurfaceFromEnergyRequirement } from "./solarPanels";

describe("solarPanelSurfaceCalculation", () => {
    it("should calculate the solar panel surface needed for the ISS", () => {
        // test with ISS data
        const efficiency = 0.07;
        const sunTemperature = 5778;
        const sunExposure = 0.5;
        const distanceToSun = 1.496e11;
        const sunRadius = 6.9634e8;
        const energyRequirement = 120000;

        const solarFlux = getSphereRadiatedEnergyFlux(sunTemperature, sunRadius, distanceToSun) * sunExposure;

        const solarPanelSurface = getSolarPanelSurfaceFromEnergyRequirement(efficiency, energyRequirement, solarFlux);
        expect(solarPanelSurface).toBeGreaterThanOrEqual(2400);
        expect(solarPanelSurface).toBeLessThanOrEqual(2600);
    });
});
