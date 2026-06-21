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
import { GreasedLineTools } from "@babylonjs/core/Misc/greasedLineTools";
import type { StarSystemCoordinates } from "@cosmos-journeyer/universe-model";
import { describe, expect, it } from "vitest";

import { getGreasedLinePathFromSystemSegments, getUniqueSystemSegments } from "./starMapPath";

function makeCoordinates(localX: number): StarSystemCoordinates {
    return {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX,
        localY: 0,
        localZ: 0,
    };
}

describe("getUniqueSystemSegments", () => {
    it("deduplicates backtracking segments", () => {
        const systemA = makeCoordinates(0);
        const systemB = makeCoordinates(0.1);

        expect(getUniqueSystemSegments([systemA, systemB, systemA])).toEqual([{ from: systemA, to: systemB }]);
    });

    it("deduplicates repeated segments independently of direction", () => {
        const systemA = makeCoordinates(0);
        const systemB = makeCoordinates(0.1);
        const systemC = makeCoordinates(0.2);

        expect(getUniqueSystemSegments([systemA, systemB, systemC, systemB, systemA])).toEqual([
            { from: systemA, to: systemB },
            { from: systemB, to: systemC },
        ]);
    });

    it("skips zero-length segments", () => {
        const systemA = makeCoordinates(0);
        const systemB = makeCoordinates(0.1);

        expect(getUniqueSystemSegments([systemA, systemA, systemB])).toEqual([{ from: systemA, to: systemB }]);
    });
});

describe("getGreasedLinePathFromSystemSegments", () => {
    it("matches the previous point segmentation for paths without duplicated segments", () => {
        const systemA = makeCoordinates(0);
        const systemB = makeCoordinates(0.3);
        const systemC = makeCoordinates(0.4);

        const path = getGreasedLinePathFromSystemSegments([systemA, systemB, systemC], (system) => ({
            x: system.localX,
            y: system.localY,
            z: system.localZ,
        }));

        const previousPoints = GreasedLineTools.SegmentizeLineBySegmentCount(
            [new Vector3(0, 0, 0), new Vector3(0.3, 0, 0), new Vector3(0.4, 0, 0)],
            2,
        );

        expect(path.points.map((point) => point.x)).toEqual(previousPoints.map((point) => point.x));
        expect(path.widths).toEqual(previousPoints.flatMap(() => [1, 1]));
    });

    it("uses invisible connector points between non-contiguous unique segments", () => {
        const systemA = makeCoordinates(0);
        const systemB = makeCoordinates(0.1);
        const systemC = makeCoordinates(0.2);

        const path = getGreasedLinePathFromSystemSegments([systemA, systemB, systemA, systemC], (system) => ({
            x: system.localX,
            y: system.localY,
            z: system.localZ,
        }));

        expect(path.points.map((point) => point.x)).toEqual([0, 0.1, 0.1, 0, 0, 0.2]);
        expect(path.widths).toEqual([1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1]);
    });
});
