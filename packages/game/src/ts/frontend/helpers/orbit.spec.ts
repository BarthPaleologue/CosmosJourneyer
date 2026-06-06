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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Rotation } from "@cosmos-journeyer/universe-model";
import { describe, expect, it } from "vitest";

import { computeAbsoluteOrientation } from "./orbit";

const baseRotation = {
    axialTilt: 0,
    spinAxisAzimuth: 0,
    siderealPeriod: 0,
    initialRotationAngle: 0,
} satisfies Rotation;

function expectQuaternionCloseTo(actual: Quaternion, expected: Quaternion): void {
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.z).toBeCloseTo(expected.z);
    expect(actual.w).toBeCloseTo(expected.w);
}

function expectVectorCloseTo(actual: Vector3, expected: Vector3): void {
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.z).toBeCloseTo(expected.z);
}

describe("computeAbsoluteOrientation", () => {
    it("returns the identity orientation when the orbit and rotation parameters are neutral", () => {
        const orientation = computeAbsoluteOrientation(0, baseRotation, 0);

        expectQuaternionCloseTo(orientation, Quaternion.Identity());
    });

    it("applies the initial rotation angle even when the sidereal period is zero", () => {
        const orientation = computeAbsoluteOrientation(
            0,
            {
                ...baseRotation,
                initialRotationAngle: Math.PI / 2,
            },
            0,
        );

        expectVectorCloseTo(Axis.X.applyRotationQuaternion(orientation), new Vector3(0, 0, -1));
    });

    it("advances the rotation according to elapsed time and sidereal period", () => {
        const orientation = computeAbsoluteOrientation(
            0,
            {
                ...baseRotation,
                siderealPeriod: 8,
                initialRotationAngle: Math.PI / 4,
            },
            1,
        );

        expectVectorCloseTo(Axis.X.applyRotationQuaternion(orientation), new Vector3(0, 0, -1));
    });

    it("applies the local spin-axis orientation before the orbital inclination", () => {
        const orientation = computeAbsoluteOrientation(
            Math.PI / 2,
            {
                ...baseRotation,
                spinAxisAzimuth: Math.PI / 2,
            },
            0,
        );

        expectVectorCloseTo(Axis.X.applyRotationQuaternion(orientation), new Vector3(0, 0, -1));
    });
});
