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

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { describe, expect, it } from "vitest";

import { createPrimaryMirrorSegments, sampleConic, TelescopePrimaryMirror } from "./primaryMirror";
import { createSpaceTelescopeModel } from "./spaceTelescopeModel";

describe("conic primary mirror", () => {
    it("reduces to the parabola for K = -1", () => {
        const sample = sampleConic(3, 4, 5, -1);
        expect(sample.height).toBeCloseTo(1.25);
        expect(sample.normal.equalsWithEpsilon(new Vector3(-0.3, 1, -0.4).normalize())).toBe(true);
    });

    it("matches spherical sag and has an upward normal at the vertex", () => {
        expect(sampleConic(3, 0, 2.5, 0).height).toBeCloseTo(1);
        expect(sampleConic(0, 0, 2.5, 0).normal.equals(Vector3.Up())).toBe(true);
    });

    it.each([-2, -1, -0.9967, 0, 1])("matches the implicit conic and numerical derivatives for K = %s", (k) => {
        const sample = sampleConic(3, 4, 10, k);
        expect(40 * sample.height - (1 + k) * sample.height ** 2).toBeCloseTo(25);
        const epsilon = 1e-4;
        const left = sampleConic(3 - epsilon, 4, 10, k);
        const right = sampleConic(3 + epsilon, 4, 10, k);
        const front = sampleConic(3, 4 - epsilon, 10, k);
        const back = sampleConic(3, 4 + epsilon, 10, k);
        expect(-sample.normal.x / sample.normal.y).toBeCloseTo((right.height - left.height) / (2 * epsilon), 7);
        expect(-sample.normal.z / sample.normal.y).toBeCloseTo((back.height - front.height) / (2 * epsilon), 7);
        expect(sample.normal.length()).toBeCloseTo(1);
    });

    it.each([
        { apertureRadius: 2, gap: 0.1 },
        { apertureRadius: 5, gap: 2 },
    ])("lays out only six first-ring segments for %j", ({ apertureRadius, gap }) => {
        const segments = createPrimaryMirrorSegments({
            apertureRadius,
            shape: { focalLength: 5, conicConstant: -1 },
            segmentation: { tileRadius: 1, gap },
        });
        expect(segments).toHaveLength(6);
        for (const { position: center } of segments) {
            expect(Math.hypot(center.x, center.z)).toBeCloseTo(Math.sqrt(3) + gap);
        }
    });

    it.each([
        createSpaceTelescopeModel().primaryMirror,
        {
            apertureRadius: 8,
            shape: { focalLength: 5, conicConstant: -1 },
            segmentation: { tileRadius: 0.5, gap: 0 },
        },
        {
            apertureRadius: 5,
            shape: { focalLength: 5, conicConstant: -1 },
            segmentation: { tileRadius: 1, gap: 2 },
        },
    ])("includes every grid tile whose center or corner lies inside the aperture for %j", (model) => {
        const { tileRadius, gap } = model.segmentation;
        const centerSpacing = Math.sqrt(3) * tileRadius + gap;
        const key = (x: number, z: number) => `${x.toFixed(6)},${z.toFixed(6)}`;
        const expected = new Set<string>();
        for (let q = -40; q <= 40; q++) {
            for (let r = -40; r <= 40; r++) {
                if (q === 0 && r === 0) {
                    continue;
                }
                const x = (Math.sqrt(3) / 2) * centerSpacing * q;
                const z = centerSpacing * (r + q / 2);
                const points = [new Vector3(x, 0, z)];
                for (let corner = 0; corner < 6; corner++) {
                    const angle = (corner * Math.PI) / 3;
                    points.push(new Vector3(x + tileRadius * Math.cos(angle), 0, z + tileRadius * Math.sin(angle)));
                }
                if (points.some((point) => point.length() <= model.apertureRadius)) {
                    expected.add(key(x, z));
                }
            }
        }
        const actual = new Set(createPrimaryMirrorSegments(model).map(({ position }) => key(position.x, position.z)));
        expect(actual).toEqual(expected);
    });

    it("places every static instance on the conic with its up axis along the normal", () => {
        const model = createSpaceTelescopeModel().primaryMirror;
        const segments = createPrimaryMirrorSegments(model);
        const positions = new Set<string>();
        for (const { position: center, rotation } of segments) {
            const matrix = Matrix.Compose(Vector3.OneReadOnly, rotation, center);
            const sample = sampleConic(center.x, center.z, model.shape.focalLength, model.shape.conicConstant);
            expect(center.y).toBeCloseTo(sample.height, 5);
            expect(Vector3.TransformNormal(Vector3.Up(), matrix).equalsWithEpsilon(sample.normal, 1e-6)).toBe(true);
            expect(matrix.determinant()).toBeCloseTo(1);
            expect(Math.hypot(center.x, center.z)).toBeGreaterThan(0.6);
            expect(Math.hypot(center.x, center.z)).toBeLessThanOrEqual(
                model.apertureRadius + model.segmentation.tileRadius,
            );
            positions.add(`${center.x},${center.z}`);
        }
        expect(positions.size).toBe(segments.length);
        expect(segments).toHaveLength(846);
    });
});

describe("TelescopePrimaryMirror", () => {
    it("renders the retained segment transforms and disposes its mesh without disposing the supplied material", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const material = new PBRMaterial("gold", scene);
        const mirror = new TelescopePrimaryMirror(createSpaceTelescopeModel().primaryMirror, material, scene);
        try {
            const mesh = mirror.getTransform();
            expect(mesh.material).toBe(material);
            const matrices = mesh.thinInstanceGetWorldMatrices();
            expect(matrices).toHaveLength(mirror.segments.length);
            for (const [index, segment] of mirror.segments.entries()) {
                const expected = Matrix.Compose(Vector3.OneReadOnly, segment.rotation, segment.position);
                expect(matrices[index]?.equalsWithEpsilon(expected, 1e-6)).toBe(true);
            }
            mirror.dispose();
            expect(mesh.isDisposed()).toBe(true);
            expect(scene.meshes).toHaveLength(0);
            expect(scene.materials).toContain(material);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
