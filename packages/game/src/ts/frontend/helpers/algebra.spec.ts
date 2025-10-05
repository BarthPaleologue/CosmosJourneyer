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
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import {
    flattenColor3Array,
    flattenVector3Array,
    getAngleFromQuaternion,
    getAxisFromQuaternion,
    getDeltaQuaternion,
    getTransformationQuaternion,
} from "./algebra";

describe("algebra utilities", () => {
    describe("getTransformationQuaternion", () => {
        it("should return identity quaternion for identical vectors", () => {
            const from = new Vector3(0, 1, 0);
            const to = new Vector3(0, 1, 0);

            const quaternion = getTransformationQuaternion(from, to);
            expect(quaternion.x).toBe(0);
            expect(quaternion.y).toBe(0);
            expect(quaternion.z).toBe(0);
            expect(quaternion.w).toBe(1);
        });

        it("should return identity quaternion for vectors with epsilon difference", () => {
            const from = new Vector3(1, 0, 0);
            const to = new Vector3(1.000001, 0, 0);
            const result = getTransformationQuaternion(from, to);

            expect(result.x).toBeCloseTo(0);
            expect(result.y).toBeCloseTo(0);
            expect(result.z).toBeCloseTo(0);
            expect(result.w).toBeCloseTo(1);
        });

        it("should compute correct rotation for 90 degree rotation around Y-axis", () => {
            const from = new Vector3(1, 0, 0);
            const to = new Vector3(0, 0, 1);
            const result = getTransformationQuaternion(from, to);

            // For 90 degree rotation from X to Z, the cross product gives (0, -1, 0)
            // So the rotation is around negative Y-axis
            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(-Math.sin(Math.PI / 4), 5);
            expect(result.z).toBeCloseTo(0, 5);
            expect(result.w).toBeCloseTo(Math.cos(Math.PI / 4), 5);
        });

        it("should handle 180 degree rotation and potential edge cases", () => {
            const from = new Vector3(1, 0, 0);
            const to = new Vector3(-1, 0, 0);
            const result = getTransformationQuaternion(from, to);

            expect(result.w).toBeCloseTo(0, 5);
            const magnitude = Math.sqrt(
                result.x * result.x + result.y * result.y + result.z * result.z + result.w * result.w,
            );
            expect(magnitude).toBeCloseTo(1, 5);
        });

        it("should handle arbitrary vector rotations", () => {
            const from = new Vector3(1, 2, 3).normalize();
            const to = new Vector3(3, 1, 2).normalize();
            const result = getTransformationQuaternion(from, to);

            // Verify the quaternion is normalized
            const magnitude = Math.sqrt(
                result.x * result.x + result.y * result.y + result.z * result.z + result.w * result.w,
            );
            expect(magnitude).toBeCloseTo(1, 5);
        });

        it("should handle parallel vectors in opposite directions", () => {
            const from = new Vector3(0, 1, 0);
            const to = new Vector3(0, -1, 0);
            const result = getTransformationQuaternion(from, to);

            expect(isNaN(result.x)).toBe(false);
            expect(isNaN(result.y)).toBe(false);
            expect(isNaN(result.z)).toBe(false);
            expect(isNaN(result.w)).toBe(false);
        });

        it("should handle non-opposite vectors correctly", () => {
            // Test with vectors that are not opposite to ensure normal operation
            const from = new Vector3(1, 1, 0).normalize();
            const to = new Vector3(0, 1, 1).normalize();
            const result = getTransformationQuaternion(from, to);

            // Should produce a valid normalized quaternion
            const magnitude = Math.sqrt(
                result.x * result.x + result.y * result.y + result.z * result.z + result.w * result.w,
            );
            expect(magnitude).toBeCloseTo(1, 5);
            expect(isNaN(result.x)).toBe(false);
            expect(isNaN(result.y)).toBe(false);
            expect(isNaN(result.z)).toBe(false);
            expect(isNaN(result.w)).toBe(false);
        });

        it("should not return NaN for valid inputs", () => {
            const from = new Vector3(-0.4268481344604848, -0.4801667479929326, 0.766449933029014);
            const to = new Vector3(-0.42943291723501903, -0.48847849882584393, 0.7597258143420544);

            const result = getTransformationQuaternion(from, to);
            expect(isNaN(result.x)).toBe(false);
            expect(isNaN(result.y)).toBe(false);
            expect(isNaN(result.z)).toBe(false);
            expect(isNaN(result.w)).toBe(false);
        });
    });

    describe("getDeltaQuaternion", () => {
        it("should return identity quaternion for identical quaternions", () => {
            const q = Quaternion.FromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 3);
            const result = getDeltaQuaternion(q, q);

            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(0, 5);
            expect(result.z).toBeCloseTo(0, 5);
            expect(result.w).toBeCloseTo(1, 5);
        });

        it("should compute correct delta between different quaternions", () => {
            const from = Quaternion.Identity();
            const to = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
            const result = getDeltaQuaternion(from, to);

            // Result should be equivalent to the 'to' quaternion since 'from' is identity
            expect(result.x).toBeCloseTo(to.x, 5);
            expect(result.y).toBeCloseTo(to.y, 5);
            expect(result.z).toBeCloseTo(to.z, 5);
            expect(result.w).toBeCloseTo(to.w, 5);
        });

        it("should compute delta that when applied gives the target quaternion", () => {
            const from = Quaternion.FromEulerAngles(Math.PI / 4, 0, 0);
            const to = Quaternion.FromEulerAngles(Math.PI / 2, Math.PI / 6, 0);
            const delta = getDeltaQuaternion(from, to);

            // Applying delta to 'from' should give 'to'
            const result = delta.multiply(from);

            expect(result.x).toBeCloseTo(to.x, 5);
            expect(result.y).toBeCloseTo(to.y, 5);
            expect(result.z).toBeCloseTo(to.z, 5);
            expect(result.w).toBeCloseTo(to.w, 5);
        });

        it("should handle quaternions with different orientations", () => {
            const from = Quaternion.FromEulerAngles(0, Math.PI, 0);
            const to = Quaternion.FromEulerAngles(Math.PI / 2, Math.PI / 2, Math.PI / 2);
            const result = getDeltaQuaternion(from, to);

            // Verify the result is normalized
            const magnitude = Math.sqrt(
                result.x * result.x + result.y * result.y + result.z * result.z + result.w * result.w,
            );
            expect(magnitude).toBeCloseTo(1, 5);
        });
    });

    describe("getAngleFromQuaternion", () => {
        it("should return 0 for identity quaternion", () => {
            const q = Quaternion.Identity();
            const angle = getAngleFromQuaternion(q);

            expect(angle).toBeCloseTo(0, 5);
        });

        it("should return π for 180 degree rotation", () => {
            const q = new Quaternion(1, 0, 0, 0); // 180 degree rotation around X-axis
            const angle = getAngleFromQuaternion(q);

            expect(angle).toBeCloseTo(Math.PI, 5);
        });

        it("should return π/2 for 90 degree rotation", () => {
            const q = Quaternion.RotationAxis(new Vector3(0, 1, 0), Math.PI / 2);
            const angle = getAngleFromQuaternion(q);

            expect(angle).toBeCloseTo(Math.PI / 2, 5);
        });

        it("should handle arbitrary rotation angles", () => {
            const inputAngle = Math.PI / 3; // 60 degrees
            const q = Quaternion.RotationAxis(new Vector3(1, 1, 1).normalize(), inputAngle);
            const outputAngle = getAngleFromQuaternion(q);

            expect(outputAngle).toBeCloseTo(inputAngle, 5);
        });

        it("should handle small angle rotations", () => {
            const inputAngle = 0.1; // Small angle
            const q = Quaternion.RotationAxis(new Vector3(0, 0, 1), inputAngle);
            const outputAngle = getAngleFromQuaternion(q);

            expect(outputAngle).toBeCloseTo(inputAngle, 5);
        });
    });

    describe("getAxisFromQuaternion", () => {
        it("should return normalized axis for rotation quaternion", () => {
            const axis = new Vector3(1, 2, 3).normalize();
            const q = Quaternion.RotationAxis(axis, Math.PI / 4);
            const result = getAxisFromQuaternion(q);

            expect(result.x).toBeCloseTo(axis.x, 5);
            expect(result.y).toBeCloseTo(axis.y, 5);
            expect(result.z).toBeCloseTo(axis.z, 5);

            // Verify the result is normalized
            const magnitude = Math.sqrt(result.x * result.x + result.y * result.y + result.z * result.z);
            expect(magnitude).toBeCloseTo(1, 5);
        });

        it("should handle X-axis rotation", () => {
            const q = Quaternion.RotationAxis(new Vector3(1, 0, 0), Math.PI / 2);
            const result = getAxisFromQuaternion(q);

            expect(result.x).toBeCloseTo(1, 5);
            expect(result.y).toBeCloseTo(0, 5);
            expect(result.z).toBeCloseTo(0, 5);
        });

        it("should handle Y-axis rotation", () => {
            const q = Quaternion.RotationAxis(new Vector3(0, 1, 0), Math.PI / 3);
            const result = getAxisFromQuaternion(q);

            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(1, 5);
            expect(result.z).toBeCloseTo(0, 5);
        });

        it("should handle Z-axis rotation", () => {
            const q = Quaternion.RotationAxis(new Vector3(0, 0, 1), Math.PI / 6);
            const result = getAxisFromQuaternion(q);

            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(0, 5);
            expect(result.z).toBeCloseTo(1, 5);
        });

        it("should handle arbitrary axis rotation", () => {
            const originalAxis = new Vector3(2, -3, 1).normalize();
            const q = Quaternion.RotationAxis(originalAxis, Math.PI / 5);
            const result = getAxisFromQuaternion(q);

            expect(result.x).toBeCloseTo(originalAxis.x, 5);
            expect(result.y).toBeCloseTo(originalAxis.y, 5);
            expect(result.z).toBeCloseTo(originalAxis.z, 5);
        });
    });

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
