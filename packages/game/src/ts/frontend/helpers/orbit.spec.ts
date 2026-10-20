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
import type { SpinModel } from "@cosmos-journeyer/universe-model";
import { describe, expect, it } from "vitest";

import { computeAbsoluteOrientation, computeSpinAxisOrientation } from "./orbit";

const baseOrbitalPlane = { inclination: 0, longitudeOfAscendingNode: 0 };

const baseSpin = {
    axialTilt: 0,
    axisAzimuth: 0,
    siderealPeriod: 0,
    initialRotationAngle: 0,
} satisfies SpinModel;

/**
 * @param actual - Observed quaternion.
 * @param expected - Expected quaternion.
 */
function expectQuaternionCloseTo(actual: Quaternion, expected: Quaternion): void {
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.z).toBeCloseTo(expected.z);
    expect(actual.w).toBeCloseTo(expected.w);
}

/**
 * @param actual - Observed vector.
 * @param expected - Expected vector.
 */
function expectVectorCloseTo(actual: Vector3, expected: Vector3): void {
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.z).toBeCloseTo(expected.z);
}

describe("computeAbsoluteOrientation", () => {
    it.each([0, 2, 4, 8])("keeps the spin axis fixed as spin advances to t=%s", (time) => {
        const orbitalPlane = { inclination: 0.3, longitudeOfAscendingNode: 0.7 };
        const spin = {
            ...baseSpin,
            axialTilt: 0.6,
            axisAzimuth: 1.2,
            initialRotationAngle: 0.4,
            siderealPeriod: 8,
        };
        const orientation = computeAbsoluteOrientation(orbitalPlane, spin, time);
        const spinAxis = computeSpinAxisOrientation(orbitalPlane, spin);
        expectVectorCloseTo(Axis.Y.applyRotationQuaternion(orientation), Axis.Y.applyRotationQuaternion(spinAxis));
    });

    it("returns the identity orientation when the orbit and spin parameters are neutral", () => {
        const orientation = computeAbsoluteOrientation(baseOrbitalPlane, baseSpin, 0);

        expectQuaternionCloseTo(orientation, Quaternion.Identity());
    });

    it("applies the initial spin angle even when the sidereal period is zero", () => {
        const orientation = computeAbsoluteOrientation(
            baseOrbitalPlane,
            {
                ...baseSpin,
                initialRotationAngle: Math.PI / 2,
            },
            0,
        );

        expectVectorCloseTo(Axis.X.applyRotationQuaternion(orientation), new Vector3(0, 0, -1));
    });

    it("advances the spin according to elapsed time and sidereal period", () => {
        const orientation = computeAbsoluteOrientation(
            baseOrbitalPlane,
            {
                ...baseSpin,
                siderealPeriod: 8,
                initialRotationAngle: Math.PI / 4,
            },
            1,
        );

        expectVectorCloseTo(Axis.X.applyRotationQuaternion(orientation), new Vector3(0, 0, -1));
    });

    it("applies the local spin-axis orientation before the orbital inclination", () => {
        const orientation = computeAbsoluteOrientation(
            { ...baseOrbitalPlane, inclination: Math.PI / 2 },
            {
                ...baseSpin,
                axisAzimuth: Math.PI / 2,
            },
            0,
        );

        expectVectorCloseTo(Axis.X.applyRotationQuaternion(orientation), new Vector3(0, 0, -1));
    });
});

describe("computeSpinAxisOrientation", () => {
    it.each([
        { inclination: 0, node: 0, axis: new Vector3(0, 1, 0) },
        { inclination: Math.PI / 2, node: 0, axis: new Vector3(-1, 0, 0) },
        { inclination: Math.PI / 2, node: Math.PI / 2, axis: new Vector3(0, 0, 1) },
        { inclination: Math.PI / 2, node: Math.PI, axis: new Vector3(1, 0, 0) },
    ])("aligns an untilted spin axis with the orbital normal for %j", ({ inclination, node, axis }) => {
        const orientation = computeSpinAxisOrientation({ inclination, longitudeOfAscendingNode: node }, baseSpin);
        expectVectorCloseTo(Axis.Y.applyRotationQuaternion(orientation), axis);
    });

    it.each([0, 0.4, Math.PI / 2, Math.PI])("preserves obliquity %s relative to the orbital normal", (axialTilt) => {
        const inclination = 0.5;
        const node = 0.8;
        const orbitalNormal = new Vector3(
            -Math.sin(inclination) * Math.cos(node),
            Math.cos(inclination),
            Math.sin(inclination) * Math.sin(node),
        );
        const orientation = computeSpinAxisOrientation(
            { inclination, longitudeOfAscendingNode: node },
            { ...baseSpin, axialTilt, axisAzimuth: 1.1 },
        );
        const axis = Axis.Y.applyRotationQuaternion(orientation);
        expect(Vector3.Dot(axis, orbitalNormal)).toBeCloseTo(Math.cos(axialTilt), 10);
    });

    it.each([
        { azimuth: 0, axis: new Vector3(-1, 0, 0) },
        { azimuth: Math.PI / 2, axis: new Vector3(0, 0, 1) },
        { azimuth: Math.PI, axis: new Vector3(1, 0, 0) },
        { azimuth: (3 * Math.PI) / 2, axis: new Vector3(0, 0, -1) },
    ])("sets the tilted spin-axis direction for azimuth $azimuth", ({ azimuth, axis }) => {
        const orientation = computeSpinAxisOrientation(baseOrbitalPlane, {
            ...baseSpin,
            axialTilt: Math.PI / 2,
            axisAzimuth: azimuth,
        });
        expectVectorCloseTo(Axis.Y.applyRotationQuaternion(orientation), axis);
    });

    it("returns only the spin-axis orientation without the sidereal spin phase", () => {
        const spinAxisOrientation = computeSpinAxisOrientation(
            { ...baseOrbitalPlane, inclination: Math.PI / 2 },
            {
                ...baseSpin,
                axisAzimuth: Math.PI / 2,
                siderealPeriod: 8,
                initialRotationAngle: Math.PI / 2,
            },
        );

        expectVectorCloseTo(Axis.X.applyRotationQuaternion(spinAxisOrientation), new Vector3(0, 0, -1));
    });
});
