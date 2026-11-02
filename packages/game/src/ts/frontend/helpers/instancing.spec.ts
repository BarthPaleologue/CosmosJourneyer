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
import { describe, expect, it } from "vitest";

import { createCircleInstanceBuffer } from "./instancing";

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
