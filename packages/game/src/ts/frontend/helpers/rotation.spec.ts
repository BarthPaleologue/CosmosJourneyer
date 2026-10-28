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

import { alignRotationToRef } from "./rotation";

describe("alignRotationToRef", () => {
    it.each([
        Vector3.Up(),
        Vector3.Down(),
        new Vector3(1, 2, 3).normalize(),
        new Vector3(3, 4, 0),
        new Vector3(0.001, -1, 0).normalize(),
        new Vector3(1e-10, 1, 0).normalize(),
    ])("aligns up with %s while keeping a finite rotation", (up) => {
        const result = Quaternion.RotationYawPitchRoll(-0.5, 0.2, 0.6);

        alignRotationToRef(Quaternion.Identity(), Vector3.UpReadOnly, up, result);

        expect(Vector3.Up().applyRotationQuaternion(result).equalsWithEpsilon(up.normalizeToNew(), 1e-6)).toBe(true);
        expect(result.asArray().every(Number.isFinite)).toBe(true);
    });

    it("preserves heading when already aligned", () => {
        const rotation = Quaternion.RotationAxis(Vector3.UpReadOnly, 0.7);
        const result = Quaternion.Identity();

        alignRotationToRef(rotation, Vector3.UpReadOnly, Vector3.UpReadOnly, result);

        expect(result.equalsWithEpsilon(rotation, 1e-12)).toBe(true);
    });

    it("aligns an exactly opposite direction from an existing rotation in place", () => {
        const rotation = Quaternion.RotationYawPitchRoll(0.4, 0.7, -0.3);
        const target = Vector3.Up().applyRotationQuaternion(rotation).negateInPlace();

        alignRotationToRef(rotation, Vector3.UpReadOnly, target, rotation);

        expect(Vector3.Up().applyRotationQuaternion(rotation).equalsWithEpsilon(target, 1e-6)).toBe(true);
        expect(rotation.asArray().every(Number.isFinite)).toBe(true);
    });

    it("aligns an opposite surface normal stored with float32 precision", () => {
        const rotation = Quaternion.RotationYawPitchRoll(0.13, 0.07, -0.11);
        const target = Vector3.FromArray(
            new Float32Array(Vector3.Up().applyRotationQuaternion(rotation).negateInPlace().asArray()),
        );

        alignRotationToRef(rotation, Vector3.UpReadOnly, target, rotation);

        expect(Vector3.Up().applyRotationQuaternion(rotation).equalsWithEpsilon(target, 1e-6)).toBe(true);
    });

    it.each([Vector3.UpReadOnly, Vector3.LeftHandedForwardReadOnly, Vector3.RightHandedForwardReadOnly])(
        "aligns the local axis %s of an existing rotation in place",
        (localAxis) => {
            const rotation = Quaternion.RotationYawPitchRoll(0.4, 0.7, -0.3);
            const target = new Vector3(1, -2, 3).normalize();

            alignRotationToRef(rotation, localAxis, target, rotation);

            expect(localAxis.applyRotationQuaternion(rotation).equalsWithEpsilon(target, 1e-6)).toBe(true);
        },
    );

    it("uses the parent's reference frame for a local rotation", () => {
        const parentRotation = Quaternion.RotationYawPitchRoll(0.4, 0.7, -0.3);
        const rotation = Quaternion.RotationYawPitchRoll(-0.5, 0.2, 0.6);
        const worldTarget = new Vector3(1, -2, 3).normalize();
        const localTarget = worldTarget.applyRotationQuaternion(parentRotation.conjugate());
        const result = Quaternion.Identity();

        alignRotationToRef(rotation, Vector3.UpReadOnly, localTarget, result);

        const worldRotation = parentRotation.multiply(result);
        expect(Vector3.Up().applyRotationQuaternion(worldRotation).equalsWithEpsilon(worldTarget, 1e-6)).toBe(true);
    });

    it("leaves its inputs and previously written results unchanged", () => {
        const rotation = Quaternion.RotationYawPitchRoll(0.4, 0.7, -0.3);
        const previousRotation = rotation.clone();
        const localAxis = new Vector3(1, 2, 3).normalize();
        const previousAxis = localAxis.clone();
        const target = new Vector3(1, -2, 3).normalize();
        const previousTarget = target.clone();
        const firstResult = Quaternion.Identity();

        alignRotationToRef(rotation, localAxis, target, firstResult);
        const previousResult = firstResult.clone();
        alignRotationToRef(rotation, Vector3.UpReadOnly, Vector3.DownReadOnly, new Quaternion());

        expect(rotation.equals(previousRotation)).toBe(true);
        expect(localAxis.equals(previousAxis)).toBe(true);
        expect(target.equals(previousTarget)).toBe(true);
        expect(firstResult.equals(previousResult)).toBe(true);
    });
});
