import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { assertUnreachable } from "@cosmos-journeyer/typescript";

import { clamp, lerp, remap } from "@/utils/math";
import { distanceToRingVolume, getNearestPointOnRingVolume } from "@/utils/ringVolume";
import type { RingVolume } from "@/utils/ringVolume";

type SolidVolume = {
    readonly center: Vector3;
    readonly radius: number;
};

export type SolidWarpInfluence = {
    readonly type: "solid";
    readonly volume: SolidVolume;
};

export type RingWarpInfluence = {
    readonly type: "ring";
    readonly volume: RingVolume;
};

export type WarpInfluence = SolidWarpInfluence | RingWarpInfluence;

/**
 * Converts clearance from a collision volume into a bounded warp speed.
 * @param collisionDistance Distance from the ship to the collision volume.
 * @param minWarpSpeed Lower bound for the allowed warp speed.
 * @param maxWarpSpeed Upper bound for the allowed warp speed.
 * @returns A target speed within the supplied bounds.
 */
function computeTargetSpeedFromCollisionDistance(
    collisionDistance: number,
    minWarpSpeed: number,
    maxWarpSpeed: number,
): number {
    const speedThreshold = 10e3;

    const closeSpeed = (speedThreshold * 0.1 * collisionDistance) / speedThreshold;
    const deepSpaceSpeed = speedThreshold * ((0.1 * collisionDistance) / speedThreshold) ** 1.2;
    return clamp(Math.max(closeSpeed, deepSpaceSpeed), minWarpSpeed, maxWarpSpeed);
}

/**
 * Computes the warp speed limit from clearance to a solid body.
 * @param influence Solid body's center and radius.
 * @param shipPosition Ship's world-space position.
 * @param minWarpSpeed Lower bound for the allowed warp speed.
 * @param maxWarpSpeed Upper bound for the allowed warp speed.
 * @returns The speed limit imposed by the body.
 */
function computeSolidInfluenceTargetSpeed(
    influence: SolidWarpInfluence,
    shipPosition: Vector3,
    minWarpSpeed: number,
    maxWarpSpeed: number,
): number {
    const collisionDistance = Math.max(
        0,
        Vector3.Distance(shipPosition, influence.volume.center) - influence.volume.radius,
    );
    return computeTargetSpeedFromCollisionDistance(collisionDistance, minWarpSpeed, maxWarpSpeed);
}

/**
 * Measures how directly the ship's forward path approaches a ring volume.
 * @param influence Ring geometry that may intersect the ship's path.
 * @param shipPosition Ship's world-space position.
 * @param shipForward Normalized ship-forward direction.
 * @returns A risk value from zero for a path away from the ring to one for a direct approach.
 */
function computeRingTrajectoryRisk(influence: RingWarpInfluence, shipPosition: Vector3, shipForward: Vector3): number {
    const nearestRingPosition = getNearestPointOnRingVolume(shipPosition, influence.volume);
    const toNearestRingPosition = nearestRingPosition.subtract(shipPosition);
    const distanceToNearestRingPosition = toNearestRingPosition.length();
    if (distanceToNearestRingPosition === 0) {
        return 1;
    }

    const trajectoryAlignment = Vector3.Dot(
        shipForward,
        toNearestRingPosition.scale(1 / distanceToNearestRingPosition),
    );
    return clamp(remap(trajectoryAlignment, 0.15, 0.85, 0, 1), 0, 1);
}

/**
 * Computes the warp speed limit from distance and approach direction to a ring.
 * @param influence Ring geometry that may intersect the ship's path.
 * @param shipPosition Ship's world-space position.
 * @param shipForward Normalized ship-forward direction.
 * @param minWarpSpeed Lower bound for the allowed warp speed.
 * @param maxWarpSpeed Upper bound for the allowed warp speed.
 * @returns The speed limit imposed by the ring.
 */
function computeRingInfluenceTargetSpeed(
    influence: RingWarpInfluence,
    shipPosition: Vector3,
    shipForward: Vector3,
    minWarpSpeed: number,
    maxWarpSpeed: number,
): number {
    const radialTargetSpeed = computeTargetSpeedFromCollisionDistance(
        distanceToRingVolume(shipPosition, influence.volume),
        minWarpSpeed,
        maxWarpSpeed,
    );
    const trajectoryRisk = computeRingTrajectoryRisk(influence, shipPosition, shipForward);
    return lerp(maxWarpSpeed, radialTargetSpeed, trajectoryRisk);
}

/**
 * Finds the strictest warp speed limit imposed by nearby collision volumes.
 * @param influences Solid bodies and rings that constrain warp speed.
 * @param shipPosition Ship's world-space position.
 * @param shipForward Normalized ship-forward direction.
 * @param minWarpSpeed Lower bound for the allowed warp speed.
 * @param maxWarpSpeed Upper bound for the allowed warp speed.
 * @returns The lowest speed limit imposed by any influence.
 */
export function computeMaxTargetSpeedFromWarpInfluences(
    influences: ReadonlyArray<WarpInfluence>,
    shipPosition: Vector3,
    shipForward: Vector3,
    minWarpSpeed: number,
    maxWarpSpeed: number,
): number {
    let maxTargetSpeed = maxWarpSpeed;

    for (const influence of influences) {
        switch (influence.type) {
            case "solid":
                maxTargetSpeed = Math.min(
                    maxTargetSpeed,
                    computeSolidInfluenceTargetSpeed(influence, shipPosition, minWarpSpeed, maxWarpSpeed),
                );
                break;
            case "ring":
                maxTargetSpeed = Math.min(
                    maxTargetSpeed,
                    computeRingInfluenceTargetSpeed(influence, shipPosition, shipForward, minWarpSpeed, maxWarpSpeed),
                );
                break;
            default:
                assertUnreachable(influence);
        }
    }

    return maxTargetSpeed;
}
