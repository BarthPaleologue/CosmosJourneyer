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

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { flattenColor3Array, flattenVector3Array } from "./algebra";

describe("algebra utilities", () => {
    describe("flattenVector3Array", () => {
        it("should return empty array for empty input", () => {
            const result = flattenVector3Array([]);
            expect(result).toEqual([]);
        });

        it("should flatten single vector correctly", () => {
            const vectors = [new Vector3(1, 2, 3)];
            const result = flattenVector3Array(vectors);

            expect(result).toEqual([1, 2, 3]);
        });

        it("should flatten multiple vectors correctly", () => {
            const vectors = [new Vector3(1, 2, 3), new Vector3(4, 5, 6), new Vector3(7, 8, 9)];
            const result = flattenVector3Array(vectors);

            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        it("should handle vectors with negative values", () => {
            const vectors = [new Vector3(-1, -2, -3), new Vector3(0, 0, 0), new Vector3(1.5, -2.5, 3.7)];
            const result = flattenVector3Array(vectors);

            expect(result).toEqual([-1, -2, -3, 0, 0, 0, 1.5, -2.5, 3.7]);
        });

        it("should handle vectors with decimal values", () => {
            const vectors = [new Vector3(0.1, 0.2, 0.3), new Vector3(1.23, 4.56, 7.89)];
            const result = flattenVector3Array(vectors);

            expect(result).toEqual([0.1, 0.2, 0.3, 1.23, 4.56, 7.89]);
        });
    });

    describe("flattenColor3Array", () => {
        it("should return empty array for empty input", () => {
            const result = flattenColor3Array([]);
            expect(result).toEqual([]);
        });

        it("should flatten single color correctly", () => {
            const colors = [new Color3(0.5, 0.7, 0.9)];
            const result = flattenColor3Array(colors);

            expect(result).toEqual([0.5, 0.7, 0.9]);
        });

        it("should flatten multiple colors correctly", () => {
            const colors = [
                new Color3(1, 0, 0), // Red
                new Color3(0, 1, 0), // Green
                new Color3(0, 0, 1), // Blue
            ];
            const result = flattenColor3Array(colors);

            expect(result).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        });

        it("should handle colors with decimal values", () => {
            const colors = [new Color3(0.25, 0.5, 0.75), new Color3(0.1, 0.9, 0.3)];
            const result = flattenColor3Array(colors);

            expect(result).toEqual([0.25, 0.5, 0.75, 0.1, 0.9, 0.3]);
        });

        it("should handle edge cases with 0 and 1 values", () => {
            const colors = [
                new Color3(0, 0, 0), // Black
                new Color3(1, 1, 1), // White
                new Color3(0.5, 0, 1), // Purple
            ];
            const result = flattenColor3Array(colors);

            expect(result).toEqual([0, 0, 0, 1, 1, 1, 0.5, 0, 1]);
        });

        it("should handle colors beyond normal range", () => {
            const colors = [new Color3(-0.1, 1.5, 2.0), new Color3(0.5, -0.5, 0.8)];
            const result = flattenColor3Array(colors);

            expect(result).toEqual([-0.1, 1.5, 2.0, 0.5, -0.5, 0.8]);
        });
    });
});
