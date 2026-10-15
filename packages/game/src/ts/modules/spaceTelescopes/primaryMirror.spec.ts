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

import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { createPrimaryMirrorMatrices, sampleConic } from "./primaryMirror";
import { createSpaceTelescopeModel, PrimaryMirrorModelSchema } from "./spaceTelescopeModel";

describe("conic primary mirror", () => {
    it("retains the historical optical parameters", () => {
        expect(PrimaryMirrorModelSchema.safeParse(createSpaceTelescopeModel().primaryMirror).success).toBe(true);
    });

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid focal length %s", (focalLength) => {
        const model = createSpaceTelescopeModel().primaryMirror;
        model.shape.focalLength = focalLength;
        expect(PrimaryMirrorModelSchema.safeParse(model).success).toBe(false);
        expect(sampleConic(1, 1, focalLength, -1)).toBeUndefined();
    });

    it("rejects invalid segmentation and a conic with a singular rim", () => {
        const model = createSpaceTelescopeModel().primaryMirror;
        expect(PrimaryMirrorModelSchema.safeParse({ ...model, apertureRadius: 0 }).success).toBe(false);
        expect(PrimaryMirrorModelSchema.safeParse({ ...model, segmentation: { tileRadius: 0, gap: 0 } }).success).toBe(
            false,
        );
        expect(PrimaryMirrorModelSchema.safeParse({ ...model, segmentation: { tileRadius: 1, gap: -1 } }).success).toBe(
            false,
        );
        model.shape = { focalLength: 1, conicConstant: 0 };
        expect(PrimaryMirrorModelSchema.safeParse(model).success).toBe(false);
        expect(sampleConic(2, 0, 1, 0)).toBeUndefined();
        expect(sampleConic(3, 0, 1, 0)).toBeUndefined();
    });

    it("reduces to the parabola for K = -1", () => {
        const sample = sampleConic(3, 4, 5, -1);
        expect(sample?.height).toBeCloseTo(1.25);
        expect(sample?.normal.equalsWithEpsilon(new Vector3(-0.3, 1, -0.4).normalize())).toBe(true);
    });

    it("matches spherical sag and has an upward normal at the vertex", () => {
        expect(sampleConic(3, 0, 2.5, 0)?.height).toBeCloseTo(1);
        expect(sampleConic(0, 0, 2.5, 0)?.normal.equals(Vector3.Up())).toBe(true);
    });

    it.each([-2, -1, -0.9967, 0, 1])("matches the implicit conic and numerical derivatives for K = %s", (k) => {
        const sample = sampleConic(3, 4, 10, k);
        expect(sample).toBeDefined();
        if (sample === undefined) {
            return;
        }
        expect(40 * sample.height - (1 + k) * sample.height ** 2).toBeCloseTo(25);
        const epsilon = 1e-4;
        const left = sampleConic(3 - epsilon, 4, 10, k);
        const right = sampleConic(3 + epsilon, 4, 10, k);
        const front = sampleConic(3, 4 - epsilon, 10, k);
        const back = sampleConic(3, 4 + epsilon, 10, k);
        expect(left).toBeDefined();
        expect(right).toBeDefined();
        expect(front).toBeDefined();
        expect(back).toBeDefined();
        if (left === undefined || right === undefined || front === undefined || back === undefined) {
            return;
        }
        expect(-sample.normal.x / sample.normal.y).toBeCloseTo((right.height - left.height) / (2 * epsilon), 7);
        expect(-sample.normal.z / sample.normal.y).toBeCloseTo((back.height - front.height) / (2 * epsilon), 7);
        expect(sample.normal.length()).toBeCloseTo(1);
    });

    it("lays out six segments in the first ring without a center tile", () => {
        const matrices = createPrimaryMirrorMatrices({
            apertureRadius: 2,
            shape: { focalLength: 5, conicConstant: -1 },
            segmentation: { tileRadius: 1, gap: 0.1 },
        });
        expect(matrices.length / 16).toBe(6);
        for (let i = 0; i < matrices.length; i += 16) {
            const center = Matrix.FromArray(matrices, i).getTranslation();
            expect(Math.hypot(center.x, center.z)).toBeCloseTo(Math.sqrt(3) + 0.1);
        }
    });

    it("places every static instance on the conic with its up axis along the normal", () => {
        const model = createSpaceTelescopeModel().primaryMirror;
        const matrices = createPrimaryMirrorMatrices(model);
        const positions = new Set<string>();
        for (let i = 0; i < matrices.length; i += 16) {
            const matrix = Matrix.FromArray(matrices, i);
            const center = matrix.getTranslation();
            const sample = sampleConic(center.x, center.z, model.shape.focalLength, model.shape.conicConstant);
            expect(center.y).toBeCloseTo(sample?.height ?? Number.NaN, 5);
            expect(
                Vector3.TransformNormal(Vector3.Up(), matrix).equalsWithEpsilon(sample?.normal ?? Vector3.Zero(), 1e-6),
            ).toBe(true);
            expect(matrix.determinant()).toBeCloseTo(1);
            expect(Math.hypot(center.x, center.z)).toBeGreaterThan(0.6);
            expect(Math.hypot(center.x, center.z)).toBeLessThanOrEqual(
                model.apertureRadius + model.segmentation.tileRadius,
            );
            positions.add(`${center.x},${center.z}`);
        }
        expect(positions.size).toBe(matrices.length / 16);
        expect(matrices.length / 16).toBe(720);
    });
});
