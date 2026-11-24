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

import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { squirrelNoise } from "@cosmos-journeyer/random";
import { describe, expect, it } from "vitest";

import { createCircleInstanceBuffer, filterPoints } from "./instancing";
import type { ScatteringLayer } from "./instancing";

describe("createCircleInstanceBuffer", () => {
    it("places cardinal instances with -Z inward and lamp width tangent to the circle", () => {
        const buffer = createCircleInstanceBuffer(10, 4);
        for (let i = 0; i < 4; i++) {
            const matrix = Matrix.FromArray(buffer, i * 16);
            const theta = (i * Math.PI) / 2;
            const outward = new Vector3(Math.cos(theta), 0, Math.sin(theta));
            expect(matrix.getTranslation().equalsWithEpsilon(outward.scale(10), 1e-6)).toBe(true);
            expect(
                Vector3.TransformNormal(new Vector3(0, 0, -1), matrix).equalsWithEpsilon(outward.negate(), 1e-6),
            ).toBe(true);
            expect(
                Vector3.TransformNormal(Vector3.UpReadOnly, matrix).equalsWithEpsilon(Vector3.UpReadOnly, 1e-6),
            ).toBe(true);
            expect(Vector3.Dot(Vector3.TransformNormal(Vector3.RightReadOnly, matrix), outward)).toBeCloseTo(0, 6);
            // A point on an asymmetric forward face must be closer to the center.
            expect(Vector3.TransformCoordinates(new Vector3(0, 0, -2), matrix).length()).toBeCloseTo(8, 6);
        }
    });
});

describe("filterPoints", () => {
    it("produces identical instances for identical seeds and consumes the provided rand source", () => {
        const pointBuffer = new Float32Array(6 * 20);
        for (let i = 0; i < 20; i++) {
            pointBuffer[i * 6] = i;
            pointBuffer[i * 6 + 1] = 1;
            pointBuffer[i * 6 + 4] = 1;
        }
        const layer: ScatteringLayer = () => ({ density: 8 });

        const makeRand = (seed: number): (() => number) => {
            let counter = 0;
            return () => squirrelNoise(seed, counter++);
        };

        let draws = 0;
        const countingRand = (): number => {
            draws++;
            return makeRand(42)();
        };

        const first = filterPoints(pointBuffer, [layer], makeRand(42));
        const second = filterPoints(pointBuffer, [layer], makeRand(42));
        filterPoints(pointBuffer, [layer], countingRand);

        expect(first[0].positions).toEqual(second[0].positions);
        expect(first[0].rotations).toEqual(second[0].rotations);
        expect(first[0].count).toBe(second[0].count);
        expect(draws).toBe(20); // One explicit draw per point: no hidden randomness.
    });
});
