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

import { deriveSteeringGeometry, getWheelSteeringAngle, computeSpeedLimitedCurvature } from "./steeringGeometry";

const wheel = (z: number, steerable: boolean) => ({ position: { x: 0, z }, steerable });
const mechanicalLimit = degreesToRadians(45);
const acceleration = 0.5 * EarthG;
const curvatureAt = (arm: number, speed: number, angle = mechanicalLimit) =>
    computeSpeedLimitedCurvature(angle, arm, speed, acceleration, mechanicalLimit);

describe("steering geometry", () => {
    it("anchors front steering at the fixed rear axle using the full wheelbase", () => {
        const geometry = deriveSteeringGeometry([wheel(2.6, true), wheel(-2.6, false)]);
        expect(geometry).toEqual({ steeringReferenceZ: -2.6, referenceLeverArm: 5.2 });
        const angle = getWheelSteeringAngle(curvatureAt(5.2, kmhToMetersPerSecond(40)), 5.2, mechanicalLimit);
        expect(angle / degreesToRadians(1)).toBeCloseTo(11.7, 1);
    });

    it("anchors rear steering at the fixed front axle and reverses its angle", () => {
        expect(deriveSteeringGeometry([wheel(2.6, false), wheel(-2.6, true)])).toEqual({
            steeringReferenceZ: 2.6,
            referenceLeverArm: 5.2,
        });
        expect(getWheelSteeringAngle(curvatureAt(5.2, 0, 0.3), -5.2, mechanicalLimit)).toBeCloseTo(-0.3);
    });

    it("gives the Wolf Mk2 equal opposite angles of about 5.9 degrees at 40 km/h", () => {
        expect(deriveSteeringGeometry([wheel(2.6, true), wheel(0, false), wheel(-2.6, true)])).toEqual({
            steeringReferenceZ: 0,
            referenceLeverArm: 2.6,
        });
        const curvature = curvatureAt(2.6, kmhToMetersPerSecond(40));
        const front = getWheelSteeringAngle(curvature, 2.6, mechanicalLimit);
        const rear = getWheelSteeringAngle(curvature, -2.6, mechanicalLimit);
        expect(front / degreesToRadians(1)).toBeCloseTo(5.9, 1);
        expect(rear).toBe(-front);
    });

    it("averages approximately coincident fixed wheels", () => {
        expect(deriveSteeringGeometry([wheel(3, true), wheel(0.0002, false), wheel(-0.0002, false)])).toEqual({
            steeringReferenceZ: 0,
            referenceLeverArm: 3,
        });
    });

    it("uses individual lever arms for asymmetric steering axles", () => {
        expect(deriveSteeringGeometry([wheel(4, true), wheel(0, false), wheel(-2, true)])).toEqual({
            steeringReferenceZ: 0,
            referenceLeverArm: 4,
        });
        const curvature = curvatureAt(4, 0, 0.4);
        expect(getWheelSteeringAngle(curvature, 4, mechanicalLimit)).toBeCloseTo(0.4);
        expect(getWheelSteeringAngle(curvature, -2, mechanicalLimit)).toBeCloseTo(-Math.atan(Math.tan(0.4) / 2));
    });

    it("infers a symmetric midpoint with no fixed axle or accepts an explicit reference", () => {
        const wheels = [wheel(5, true), wheel(-1, true)];
        expect(deriveSteeringGeometry(wheels)).toEqual({ steeringReferenceZ: 2, referenceLeverArm: 3 });
        expect(deriveSteeringGeometry(wheels, { steeringReferenceZOverride: 0 })).toEqual({
            steeringReferenceZ: 0,
            referenceLeverArm: 5,
        });
    });

    it("requires an override for incompatible fixed axles", () => {
        const wheels = [wheel(4, true), wheel(0, false), wheel(-2, false)];
        expect(deriveSteeringGeometry(wheels)).toBeUndefined();
        expect(deriveSteeringGeometry(wheels, { steeringReferenceZOverride: -1 })).toEqual({
            steeringReferenceZ: -1,
            referenceLeverArm: 5,
        });
    });

    it("handles absent steering and degenerate geometry safely", () => {
        expect(deriveSteeringGeometry([])).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, false)])).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, true), wheel(0, false)])).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, true), wheel(0, true)])).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, true)], { steeringReferenceZOverride: 0 })).toBeUndefined();
        expect(deriveSteeringGeometry([wheel(0, true)], { steeringReferenceZOverride: NaN })).toBeUndefined();
        expect(curvatureAt(0, 0)).toBe(0);
    });
});

describe("curvature budget", () => {
    it("retains mechanical limits at rest and near zero speed", () => {
        for (const speed of [0, 0.00001, 0.001, 0.01]) {
            const curvature = curvatureAt(2.6, speed, 1.2);
            expect(Number.isFinite(curvature)).toBe(true);
            expect(getWheelSteeringAngle(curvature, 2.6, mechanicalLimit)).toBeCloseTo(mechanicalLimit);
            expect(getWheelSteeringAngle(curvature, -2.6, mechanicalLimit)).toBeCloseTo(-mechanicalLimit);
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
