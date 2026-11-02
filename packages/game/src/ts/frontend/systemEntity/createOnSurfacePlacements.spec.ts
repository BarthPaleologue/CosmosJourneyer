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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { createSurfaceTransform } from "./createOnSurfacePlacements";

describe("createSurfaceTransform", () => {
    it.each([
        [0, 0, 0, 0, 0],
        [0, 0, Math.PI / 2, 0, 0],
        [0, 0, 0, Math.PI / 6, 0],
        [0, 0, 0, 0, Math.PI / 3],
        [0.7, -1.2, 0.4, 0.3, -0.6],
        [Math.PI / 2, 0.8, 0.2, -0.4, 0.5],
    ])(
        "preserves geographic heading, pitch and intrinsic roll at %s, %s",
        (latitude, longitude, heading, pitch, roll) => {
            const { position, rotation } = createSurfaceTransform(latitude, longitude, 100, { heading, pitch, roll });
            const radial = new Vector3(
                Math.cos(latitude) * Math.cos(longitude),
                Math.sin(latitude),
                Math.cos(latitude) * Math.sin(longitude),
            );
            const north = new Vector3(
                -Math.sin(latitude) * Math.cos(longitude),
                Math.cos(latitude),
                -Math.sin(latitude) * Math.sin(longitude),
            );
            const east = new Vector3(-Math.sin(longitude), 0, Math.cos(longitude));
            const forward = new Vector3(0, 0, -1).applyRotationQuaternion(rotation);
            expect(position.equalsWithEpsilon(radial.scale(100), 1e-6)).toBe(true);
            expect(Vector3.Dot(forward, north)).toBeCloseTo(Math.cos(heading) * Math.cos(pitch), 6);
            expect(Vector3.Dot(forward, east)).toBeCloseTo(Math.sin(heading) * Math.cos(pitch), 6);
            expect(Vector3.Dot(forward, radial)).toBeCloseTo(Math.sin(pitch), 6);
            const unrolled = createSurfaceTransform(latitude, longitude, 100, { heading, pitch, roll: 0 }).rotation;
            const expectedUp = Vector3.Up()
                .applyRotationQuaternion(unrolled)
                .applyRotationQuaternion(Quaternion.RotationAxis(forward, roll));
            expect(Vector3.Up().applyRotationQuaternion(rotation).equalsWithEpsilon(expectedUp, 1e-6)).toBe(true);
            const parent = Quaternion.RotationYawPitchRoll(0.5, -0.3, 0.7);
            expect(
                new Vector3(0, 0, -1)
                    .applyRotationQuaternion(parent.multiply(rotation))
                    .equalsWithEpsilon(forward.applyRotationQuaternion(parent), 1e-6),
            ).toBe(true);
        },
    );
});
