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

import { getGravitationalLensFocalDistance } from "../src/ts/utils/gravitationalLensing";
import { Settings } from "../src/ts/settings";

test("gravitationalLensing", () => {
    const solarMass = 1.989e30; // in kg
    const solarRadius = 6.9634e8; // in meters

    const focalLength = getGravitationalLensFocalDistance(solarMass, solarRadius);
    expect(focalLength).toBeGreaterThan(530 * Settings.AU);
    expect(focalLength).toBeLessThan(550 * Settings.AU);
});
