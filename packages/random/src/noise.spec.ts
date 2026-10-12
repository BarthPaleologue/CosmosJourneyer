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

import { expect, it } from "vitest";

import { makeNoise3D, getRngFromSeed } from "./index";

// fast-simplex-noise consumes a sequential source while building its permutation table.
function sequentialSource(): () => number {
    const rng = getRngFromSeed(42);
    let index = 0;
    return () => rng(index++);
}
it("preserves fast-simplex-noise@4.0.0 outputs", () => {
    const noise3D = makeNoise3D(sequentialSource());
    expect(
        [
            [0, 0, 0],
            [0.1, 0.2, 0.3],
            [-2.5, 7.25, -1.125],
            [100, -20, 7],
        ].map(([x = 0, y = 0, z = 0]) => noise3D(x, y, z)),
    ).toEqual([0, 0.14062066323283273, -0.04304090990503559, 0]);
    expect(makeNoise3D(() => getRngFromSeed(42)(0))(0.1, 0.2, 0.3)).toBe(-0.6846858660819777);
});
