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

import { Quaternion, TmpVectors, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { alignRotationToRef, quaternionFromForwardUpRH } from "./rotation";

describe("alignRotationToRef", () => {
    it("accepts Babylon temporary storage as inputs without overwriting it", () => {
        const rotation = TmpVectors.Quaternion[0];
        const localAxis = TmpVectors.Vector3[1];
        const target = TmpVectors.Vector3[2];
        const savedRotation = rotation.clone();
        const savedAxis = localAxis.clone();
        const savedTarget = target.clone();
        try {
            rotation.copyFrom(Quaternion.RotationYawPitchRoll(0.4, 0.7, -0.3));
            localAxis.set(1, 2, 3).normalize();
            target.set(1, -2, 3);
            const previousRotation = rotation.clone();
            const previousAxis = localAxis.clone();
            const previousTarget = target.clone();
            const result = Quaternion.Identity();

            alignRotationToRef(rotation, localAxis, target, result);

            expect(rotation.equals(previousRotation)).toBe(true);
            expect(localAxis.equals(previousAxis)).toBe(true);
            expect(target.equals(previousTarget)).toBe(true);
            expect(localAxis.applyRotationQuaternion(result).equalsWithEpsilon(target.normalizeToNew(), 1e-6)).toBe(
                true,
            );
        } finally {
            rotation.copyFrom(savedRotation);
            localAxis.copyFrom(savedAxis);
            target.copyFrom(savedTarget);
        }
    });

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

describe("quaternionFromForwardUpRH", () => {
    it("returns the identity rotation for the local forward and up axes", () => {
        const q = quaternionFromForwardUpRH(new Vector3(0, 0, -1), Vector3.UpReadOnly);
        expect(Vector3.Right().applyRotationQuaternion(q).equalsWithEpsilon(Vector3.RightReadOnly, 1e-6)).toBe(true);
        expect(Vector3.Up().applyRotationQuaternion(q).equalsWithEpsilon(Vector3.UpReadOnly, 1e-6)).toBe(true);
    });

    it("accepts Babylon temporaries without modifying them or earlier results", () => {
        const forward = TmpVectors.Vector3[0];
        const up = TmpVectors.Vector3[1];
        const savedForward = forward.clone();
        const savedUp = up.clone();
        try {
            forward.set(1, 2, -3);
            up.set(0, 1, 0);
            const q = quaternionFromForwardUpRH(forward, up);
            const savedResult = q.clone();
            quaternionFromForwardUpRH(Vector3.DownReadOnly, Vector3.RightReadOnly);
            expect(forward.equals(new Vector3(1, 2, -3))).toBe(true);
            expect(up.equals(Vector3.UpReadOnly)).toBe(true);
            expect(q.equals(savedResult)).toBe(true);
        } finally {
            forward.copyFrom(savedForward);
            up.copyFrom(savedUp);
        }
    });
    it.each([
        [new Vector3(0, 0, -1), Vector3.Up()],
        [new Vector3(1, 2, 3), new Vector3(-2, 5, 1)],
        [Vector3.Up(), Vector3.Right()],
    ])("maps -Z to forward and +Y to projected up without changing inputs", (forward, up) => {
        const savedForward = forward.clone();
        const savedUp = up.clone();
        const q = quaternionFromForwardUpRH(forward, up);
        const f = forward.normalizeToNew();
        const u = up.subtract(f.scale(Vector3.Dot(up, f))).normalize();
        expect(new Vector3(0, 0, -1).applyRotationQuaternion(q).equalsWithEpsilon(f, 1e-6)).toBe(true);
        expect(Vector3.Up().applyRotationQuaternion(q).equalsWithEpsilon(u, 1e-6)).toBe(true);
        expect(forward.equals(savedForward)).toBe(true);
        expect(up.equals(savedUp)).toBe(true);
    });

    it.each([
        [Vector3.Zero(), Vector3.Up()],
        [new Vector3(NaN, 1, 0), Vector3.Up()],
        [new Vector3(Infinity, 0, 0), Vector3.Up()],
        [Vector3.Up(), Vector3.Up()],
        [Vector3.Down(), Vector3.Up()],
        [new Vector3(1, 2, 3), Vector3.Zero()],
        [new Vector3(1, 2, 3), new Vector3(Infinity, 0, 0)],
        [new Vector3(0, 1, 1e-9), Vector3.Up()],
        [new Vector3(1e300, 2e300, -3e300), new Vector3(0, 1e-300, 0)],
    ])("produces a finite direct orthonormal basis for degenerate or extreme inputs", (forward, up) => {
        const q = quaternionFromForwardUpRH(forward, up);
        expect(q.asArray().every(Number.isFinite)).toBe(true);
        const x = Vector3.Right().applyRotationQuaternion(q);
        const y = Vector3.Up().applyRotationQuaternion(q);
        const z = new Vector3(0, 0, 1).applyRotationQuaternion(q);
        for (const axis of [x, y, z]) {
            expect(axis.length()).toBeCloseTo(1, 6);
        }
        expect(Vector3.Dot(x, y)).toBeCloseTo(0, 6);
        expect(Vector3.Dot(y, z)).toBeCloseTo(0, 6);
        expect(Vector3.Dot(z, x)).toBeCloseTo(0, 6);
        expect(Vector3.Dot(Vector3.Cross(x, y), z)).toBeCloseTo(1, 6);
        const scale = Math.max(Math.abs(forward.x), Math.abs(forward.y), Math.abs(forward.z));
        if (Number.isFinite(scale) && scale > 0) {
            const expected = new Vector3(forward.x / scale, forward.y / scale, forward.z / scale).normalize();
            expect(z.negate().equalsWithEpsilon(expected, 1e-6)).toBe(true);
        } else {
            expect(x.equalsWithEpsilon(Vector3.RightReadOnly, 1e-6)).toBe(true);
            expect(y.equalsWithEpsilon(Vector3.UpReadOnly, 1e-6)).toBe(true);
        }
    });
});
