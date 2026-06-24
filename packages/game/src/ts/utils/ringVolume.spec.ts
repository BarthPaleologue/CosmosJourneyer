import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import {
    distanceToRingVolume,
    getNearestPointOnRingVolume,
    isPositionInsideRingVolume,
    type RingVolume,
} from "./ringVolume";

const ring: RingVolume = {
    center: Vector3.Zero(),
    normal: Vector3.Up(),
    innerRadius: 1_000,
    outerRadius: 2_000,
    halfThickness: 100,
};

describe("ringVolume", () => {
    it("computes vertical distance above the annulus volume", () => {
        expect(distanceToRingVolume(new Vector3(1_500, 250, 0), ring)).toBe(150);
    });

    it("computes radial distance from the center hole", () => {
        expect(distanceToRingVolume(new Vector3(800, 0, 0), ring)).toBe(200);
    });

    it("computes radial distance from outside the outer edge", () => {
        expect(distanceToRingVolume(new Vector3(2_250, 0, 0), ring)).toBe(250);
    });

    it("detects positions inside the ring volume", () => {
        expect(isPositionInsideRingVolume(new Vector3(1_500, 50, 0), ring)).toBe(true);
        expect(isPositionInsideRingVolume(new Vector3(1_500, 150, 0), ring)).toBe(false);
    });

    it("returns the nearest point on the ring volume", () => {
        const nearestPoint = getNearestPointOnRingVolume(new Vector3(1_500, 250, 0), ring);

        expect(nearestPoint.x).toBe(1_500);
        expect(nearestPoint.y).toBe(100);
        expect(nearestPoint.z).toBe(0);
    });

    it("does not require the ring normal to be normalized", () => {
        const scaledNormalRing = {
            ...ring,
            normal: Vector3.Up().scale(3),
        };

        expect(distanceToRingVolume(new Vector3(1_500, 250, 0), scaledNormalRing)).toBe(150);
    });
});
