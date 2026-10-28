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
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { describe, expect, it } from "vitest";

import { createPanelsFromFrame } from "./panelsFromFrame";

describe("createPanelsFromFrame", () => {
    it.each([
        { name: "horizontal", rotation: Quaternion.Identity() },
        { name: "vertical", rotation: Quaternion.RotationAxis(Vector3.RightReadOnly, Math.PI / 2) },
        { name: "oblique", rotation: Quaternion.RotationYawPitchRoll(0.3, 0.7, -0.4) },
    ])("keeps an asymmetric $name panel within its frame", ({ rotation }) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const origin = new Vector3(2, 3, -1);
            const points = [Vector3.Zero(), new Vector3(4, 0, 0), new Vector3(0, 0, 2)].map((point) =>
                point.applyRotationQuaternion(rotation).addInPlace(origin),
            );
            const normal = Vector3.Down().applyRotationQuaternion(rotation);
            const thickness = 0.01;
            const panel = createPanelsFromFrame(
                "triangle",
                new Float32Array(points.flatMap((point) => point.asArray())),
                new Uint32Array([0, 1, 1, 2, 2, 0]),
                thickness,
                scene,
            );
            const vertices = panel?.getVerticesData("position") ?? [];
            expect(vertices.length).toBeGreaterThan(0);

            for (let i = 0; i < vertices.length; i += 3) {
                const vertex = Vector3.FromArray(vertices, i);
                const distanceToFrame = Math.min(
                    ...points.map((point) => {
                        const offset = vertex.subtract(point);
                        return offset.subtract(normal.scale(Vector3.Dot(offset, normal))).length();
                    }),
                );
                expect(distanceToFrame).toBeLessThan(1e-5);
                expect(Math.abs(Vector3.Dot(vertex.subtract(origin), normal))).toBeLessThan(thickness + 1e-5);
            }
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
