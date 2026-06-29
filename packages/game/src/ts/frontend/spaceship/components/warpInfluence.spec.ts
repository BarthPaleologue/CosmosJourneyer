import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import {
    computeMaxTargetSpeedFromWarpInfluences,
    type RingWarpInfluence,
    type SolidWarpInfluence,
} from "./warpInfluence";

const minWarpSpeed = 30_000;
const maxWarpSpeed = 1_000_000;

const ringInfluence: RingWarpInfluence = {
    type: "ring",
    volume: {
        center: Vector3.Zero(),
        normal: Vector3.Up(),
        innerRadius: 1_000,
        outerRadius: 2_000,
        halfThickness: 100,
    },
};

describe("warpInfluence", () => {
    it("returns the maximum warp speed when there are no influences", () => {
        expect(
            computeMaxTargetSpeedFromWarpInfluences([], Vector3.Zero(), Vector3.Forward(), minWarpSpeed, maxWarpSpeed),
        ).toBe(maxWarpSpeed);
    });

    it("limits speed near solid influences", () => {
        const solidInfluence: SolidWarpInfluence = {
            type: "solid",
            volume: {
                center: new Vector3(200_000, 0, 0),
                radius: 1_000,
            },
        };

        const targetSpeed = computeMaxTargetSpeedFromWarpInfluences(
            [solidInfluence],
            Vector3.Zero(),
            Vector3.Forward(),
            minWarpSpeed,
            maxWarpSpeed,
        );

        expect(targetSpeed).toBeLessThan(maxWarpSpeed);
    });

    it("ignores ring speed limits when the ship is moving away from the ring", () => {
        const targetSpeed = computeMaxTargetSpeedFromWarpInfluences(
            [ringInfluence],
            new Vector3(1_500, 1_000, 0),
            Vector3.Up(),
            minWarpSpeed,
            maxWarpSpeed,
        );

        expect(targetSpeed).toBe(maxWarpSpeed);
    });

    it("applies ring speed limits when the ship is moving toward the ring", () => {
        const targetSpeed = computeMaxTargetSpeedFromWarpInfluences(
            [ringInfluence],
            new Vector3(1_500, 1_000, 0),
            Vector3.Down(),
            minWarpSpeed,
            maxWarpSpeed,
        );

        expect(targetSpeed).toBeLessThan(maxWarpSpeed);
    });

    it("uses the most restrictive influence", () => {
        const farSolidInfluence: SolidWarpInfluence = {
            type: "solid",
            volume: {
                center: new Vector3(2_000_000, 0, 0),
                radius: 1_000,
            },
        };

        const ringTargetSpeed = computeMaxTargetSpeedFromWarpInfluences(
            [ringInfluence],
            new Vector3(1_500, 1_000, 0),
            Vector3.Down(),
            minWarpSpeed,
            maxWarpSpeed,
        );
        const combinedTargetSpeed = computeMaxTargetSpeedFromWarpInfluences(
            [farSolidInfluence, ringInfluence],
            new Vector3(1_500, 1_000, 0),
            Vector3.Down(),
            minWarpSpeed,
            maxWarpSpeed,
        );

        expect(combinedTargetSpeed).toBe(ringTargetSpeed);
    });
});
