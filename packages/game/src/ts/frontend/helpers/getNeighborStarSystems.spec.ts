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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { expect, test } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { starSystemCoordinatesEquals } from "@/backend/universe/starSystemCoordinates";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { getNeighborStarSystemCoordinates } from "./getNeighborStarSystems";

test("getNeighborStarSystemCoordinates", () => {
    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());

    const systemCoordinates = starSystemDatabase.getSystemCoordinatesFromSeed(0.0, 0.0, 0.0, 0);

    for (let i = 0; i < 10; i++) {
        const searchRadius = 5 * i;

        const neighbors = getNeighborStarSystemCoordinates(systemCoordinates, searchRadius, starSystemDatabase);
        neighbors.forEach((neighbor) => {
            const { coordinates: starSystemCoordinates, position, distance } = neighbor;
            expect(position).toBeInstanceOf(Vector3);
            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThanOrEqual(searchRadius);

            // Check that the neighbor is not the system itself
            expect(starSystemCoordinatesEquals(starSystemCoordinates, systemCoordinates)).toBe(false);
        });
    }
});
