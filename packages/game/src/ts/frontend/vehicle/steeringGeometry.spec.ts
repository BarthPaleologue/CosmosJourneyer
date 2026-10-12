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

import { degreesToRadians, EarthG, kmhToMetersPerSecond } from "@cosmos-journeyer/physics";
import { describe, expect, it } from "vitest";

import {
    deriveSteeringGeometry,
    getMechanicalCurvatureLimits,
    getWheelSteeringAngle,
    computeSpeedLimitedCurvature,
} from "./steeringGeometry";

const wheel = (z: number, steerable: boolean) => ({ position: { x: 0, z }, steerable });
const mechanicalLimit = degreesToRadians(45);
const acceleration = 0.5 * EarthG;
const curvatureAt = (arm: number, speed: number, angle = mechanicalLimit) =>
    computeSpeedLimitedCurvature(angle, arm, speed, acceleration, mechanicalLimit);

describe("steering geometry", () => {
    it("anchors front steering at the fixed rear axle using the full wheelbase", () => {
        const geometry = deriveSteeringGeometry([wheel(2.6, true), wheel(-2.6, false)], mechanicalLimit);
        expect(geometry).toEqual({
            steeringReferenceZ: -2.6,
            referenceLeverArm: 5.2,
            mechanicalCurvatureLimits: {
                maxCurvature: Math.tan(mechanicalLimit) / 5.2,
                minCurvature: -Math.tan(mechanicalLimit) / 5.2,
            },
        });
        const angle = getWheelSteeringAngle(curvatureAt(5.2, kmhToMetersPerSecond(40)), 5.2, mechanicalLimit, 0);
        expect(angle / degreesToRadians(1)).toBeCloseTo(11.7, 1);
    });

    it("anchors rear steering at the fixed front axle and reverses its angle", () => {
        expect(deriveSteeringGeometry([wheel(2.6, false), wheel(-2.6, true)], mechanicalLimit)).toMatchObject({
            steeringReferenceZ: 2.6,
            referenceLeverArm: 5.2,
        });
        expect(getWheelSteeringAngle(curvatureAt(5.2, 0, 0.3), -5.2, mechanicalLimit, 0)).toBeCloseTo(-0.3);
    });

    it("gives the Wolf Mk2 centerline equal opposite angles of about 5.9 degrees at 40 km/h", () => {
        expect(
            deriveSteeringGeometry([wheel(2.6, true), wheel(0, false), wheel(-2.6, true)], mechanicalLimit),
        ).toMatchObject({
            steeringReferenceZ: 0,
            referenceLeverArm: 2.6,
        });
        const curvature = curvatureAt(2.6, kmhToMetersPerSecond(40));
        const front = getWheelSteeringAngle(curvature, 2.6, mechanicalLimit, 0);
        const rear = getWheelSteeringAngle(curvature, -2.6, mechanicalLimit, 0);
        expect(front / degreesToRadians(1)).toBeCloseTo(5.9, 1);
        expect(rear).toBe(-front);
    });

    it("averages approximately coincident fixed wheels", () => {
        expect(
            deriveSteeringGeometry([wheel(3, true), wheel(0.0002, false), wheel(-0.0002, false)], mechanicalLimit),
        ).toMatchObject({
            steeringReferenceZ: 0,
            referenceLeverArm: 3,
        });
    });

    it("uses individual lever arms for asymmetric steering axles", () => {
        expect(
            deriveSteeringGeometry([wheel(4, true), wheel(0, false), wheel(-2, true)], mechanicalLimit),
        ).toMatchObject({
            steeringReferenceZ: 0,
            referenceLeverArm: 4,
        });
        const curvature = curvatureAt(4, 0, 0.4);
        expect(getWheelSteeringAngle(curvature, 4, mechanicalLimit, 0)).toBeCloseTo(0.4);
        expect(getWheelSteeringAngle(curvature, -2, mechanicalLimit, 0)).toBeCloseTo(-Math.atan(Math.tan(0.4) / 2));
    });

    it("infers a symmetric midpoint with no fixed axle or accepts an explicit reference", () => {
        const wheels = [wheel(5, true), wheel(-1, true)];
        expect(deriveSteeringGeometry(wheels, mechanicalLimit)).toMatchObject({
            steeringReferenceZ: 2,
            referenceLeverArm: 3,
        });
        expect(deriveSteeringGeometry(wheels, mechanicalLimit, { steeringReferenceZOverride: 0 })).toMatchObject({
            steeringReferenceZ: 0,
            referenceLeverArm: 5,
        });
    });

    it("requires an override for incompatible fixed axles", () => {
        const wheels = [wheel(4, true), wheel(0, false), wheel(-2, false)];
        expect(deriveSteeringGeometry(wheels, mechanicalLimit)).toBeUndefined();
        expect(deriveSteeringGeometry(wheels, mechanicalLimit, { steeringReferenceZOverride: -1 })).toMatchObject({
            steeringReferenceZ: -1,
            referenceLeverArm: 5,
        });
    });

    it("handles absent steering and degenerate geometry safely", () => {
        expect(deriveSteeringGeometry([], mechanicalLimit)).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, false)], mechanicalLimit)).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, true), wheel(0, false)], mechanicalLimit)).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, true), wheel(0, true)], mechanicalLimit)).toBeUndefined();
        expect(
            deriveSteeringGeometry([wheel(0, true)], mechanicalLimit, { steeringReferenceZOverride: 0 }),
        ).toBeUndefined();
        expect(
            deriveSteeringGeometry([wheel(0, true)], mechanicalLimit, { steeringReferenceZOverride: NaN }),
        ).toBeUndefined();
        expect(curvatureAt(0, 0)).toBe(0);
    });
});

describe("curvature budget", () => {
    it("retains mechanical limits at rest and near zero speed", () => {
        for (const speed of [0, 0.00001, 0.001, 0.01]) {
            const curvature = curvatureAt(2.6, speed, 1.2);
            expect(Number.isFinite(curvature)).toBe(true);
            expect(getWheelSteeringAngle(curvature, 2.6, mechanicalLimit, 0)).toBeCloseTo(mechanicalLimit);
            expect(getWheelSteeringAngle(curvature, -2.6, mechanicalLimit, 0)).toBeCloseTo(-mechanicalLimit);
        }
    });

    it("decreases maximum curvature with speed squared and supports acceleration tuning", () => {
        const speed = kmhToMetersPerSecond(40);
        expect(curvatureAt(2.6, speed)).toBeCloseTo(acceleration / speed ** 2);
        expect(curvatureAt(2.6, speed * 2)).toBeCloseTo(curvatureAt(2.6, speed) / 4);
        expect(
            computeSpeedLimitedCurvature(mechanicalLimit, 2.6, speed, acceleration * 2, mechanicalLimit),
        ).toBeCloseTo(curvatureAt(2.6, speed) * 2);
    });

    it("preserves turning signs in reverse and when changing direction", () => {
        expect(curvatureAt(2.6, -20)).toBe(curvatureAt(2.6, 20));
        expect(curvatureAt(2.6, 20, -mechanicalLimit)).toBe(-curvatureAt(2.6, 20));
    });
});

describe("Ackermann steering", () => {
    const positionedWheel = (x: number, z: number, steerable = true) => ({
        position: { x, z },
        steerable,
    });

    it("steers the inside wheel further and gives both wheels the same turning center", () => {
        const curvature = 0.1;
        const inner = getWheelSteeringAngle(curvature, 5.2, mechanicalLimit, 1);
        const outer = getWheelSteeringAngle(curvature, 5.2, mechanicalLimit, -1);
        expect(inner).toBeGreaterThan(outer);
        expect(1 + 5.2 / Math.tan(inner)).toBeCloseTo(1 / curvature);
        expect(-1 + 5.2 / Math.tan(outer)).toBeCloseTo(1 / curvature);
    });

    it("mirrors left/right turns and reverses rear steering with the same center", () => {
        for (const x of [-2.2, 2.2]) {
            const front = getWheelSteeringAngle(0.1, 2.6, mechanicalLimit, x);
            const rear = getWheelSteeringAngle(0.1, -2.6, mechanicalLimit, x);
            expect(rear).toBe(-front);
            expect(getWheelSteeringAngle(-0.1, 2.6, mechanicalLimit, -x)).toBe(-front);
            expect(x - 2.6 / Math.tan(rear)).toBeCloseTo(10);
        }
    });

    it("limits the common curvature at the inner wheel's mechanical stop", () => {
        const wheels = [
            positionedWheel(2.2, 2.6),
            positionedWheel(-2.2, 2.6),
            positionedWheel(2.2, -2.6),
            positionedWheel(-2.2, -2.6),
        ];
        const limits = getMechanicalCurvatureLimits(wheels, 0, mechanicalLimit);
        expect(limits.maxCurvature).toBeCloseTo(1 / 4.8);
        expect(limits.minCurvature).toBeCloseTo(-limits.maxCurvature);
        expect(getWheelSteeringAngle(limits.maxCurvature, 2.6, mechanicalLimit, 2.2)).toBeCloseTo(mechanicalLimit);
        expect(getWheelSteeringAngle(limits.maxCurvature, 2.6, mechanicalLimit, -2.2)).toBeCloseTo(Math.atan(2.6 / 7));
        for (const positioned of wheels) {
            const angle = getWheelSteeringAngle(
                limits.maxCurvature,
                positioned.position.z,
                mechanicalLimit,
                positioned.position.x,
            );
            expect(positioned.position.x + positioned.position.z / Math.tan(angle)).toBeCloseTo(4.8);
        }
    });

    it("supports front-only, rear-only, and asymmetric layouts without assuming a track width", () => {
        for (const frontSteering of [true, false]) {
            const wheels = [
                positionedWheel(1, 2.6, frontSteering),
                positionedWheel(-1, 2.6, frontSteering),
                positionedWheel(1, -2.6, !frontSteering),
                positionedWheel(-1, -2.6, !frontSteering),
            ];
            const reference = frontSteering ? -2.6 : 2.6;
            const limits = getMechanicalCurvatureLimits(wheels, reference, mechanicalLimit);
            expect(limits.maxCurvature).toBeCloseTo(1 / 6.2);
            expect(limits.minCurvature).toBeCloseTo(-limits.maxCurvature);
        }
        const asymmetric = getMechanicalCurvatureLimits(
            [positionedWheel(2, 4), positionedWheel(-1, -2)],
            0,
            mechanicalLimit,
        );
        expect(asymmetric.maxCurvature).toBeCloseTo(1 / 6);
        expect(asymmetric.minCurvature).toBeCloseTo(-1 / 3);
    });

    it("does not divide by zero at the turning center or for wheels on the reference axle", () => {
        expect(getWheelSteeringAngle(0.5, 2.6, mechanicalLimit, 2)).toBe(mechanicalLimit);
        expect(getWheelSteeringAngle(0.5, 0, mechanicalLimit, 2)).toBe(0);
        expect(getWheelSteeringAngle(0, 2.6, mechanicalLimit, 2)).toBe(0);
        expect(getMechanicalCurvatureLimits([], 0, mechanicalLimit)).toEqual({
            maxCurvature: Infinity,
            minCurvature: -Infinity,
        });
    });
});
