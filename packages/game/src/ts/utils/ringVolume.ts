import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { clamp } from "./math";

export type RingVolume = {
    readonly center: Vector3;
    readonly normal: Vector3;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly halfThickness: number;
};

export type RingProjection = {
    readonly signedHeight: number;
    readonly planarDistance: number;
    readonly planarPosition: Vector3;
};

/**
 * Projects a point onto the ring's mid-plane and measures its signed height.
 * @param position World-space point to project.
 * @param ring Ring center, plane normal, radial bounds, and half-thickness.
 * @returns Signed height along the plane normal, planar distance from the center, and planar offset.
 */
export function projectPositionOnRingPlane(position: Vector3, ring: RingVolume): RingProjection {
    const normal = getRingNormal(ring);
    const relativePosition = position.subtract(ring.center);
    const signedHeight = Vector3.Dot(relativePosition, normal);
    const planarPosition = relativePosition.subtract(normal.scale(signedHeight));

    return {
        signedHeight,
        planarDistance: planarPosition.length(),
        planarPosition,
    };
}

/**
 * Checks whether a planar radius lies strictly between the ring edges.
 * @param planarDistance Distance from the ring center after projection onto its plane.
 * @param ring Ring supplying the inner and outer radii.
 * @returns Whether the distance is greater than `innerRadius` and less than `outerRadius`.
 */
export function isInsideRingRadialBounds(planarDistance: number, ring: RingVolume): boolean {
    return planarDistance > ring.innerRadius && planarDistance < ring.outerRadius;
}

/**
 * Checks whether a point lies within both the ring's radial bounds and thickness.
 * @param position World-space point to test.
 * @param ring Ring volume to test against.
 * @returns Whether the point is inside the ring's open radial and vertical bounds.
 */
export function isPositionInsideRingVolume(position: Vector3, ring: RingVolume): boolean {
    const projection = projectPositionOnRingPlane(position, ring);
    return (
        Math.abs(projection.signedHeight) < ring.halfThickness &&
        isInsideRingRadialBounds(projection.planarDistance, ring)
    );
}

/**
 * Finds the closest point on or within the ring volume's bounding surfaces.
 * @param position World-space point to measure from.
 * @param ring Ring volume whose bounds contain the result.
 * @returns Nearest point after clamping radial distance and height to the closed bounds.
 */
export function getNearestPointOnRingVolume(position: Vector3, ring: RingVolume): Vector3 {
    const normal = getRingNormal(ring);
    const projection = projectPositionOnRingPlane(position, ring);
    const nearestPlanarDistance = clamp(projection.planarDistance, ring.innerRadius, ring.outerRadius);
    const nearestPlanarPosition =
        projection.planarDistance > 0
            ? projection.planarPosition.scale(nearestPlanarDistance / projection.planarDistance)
            : getFallbackRingPlanarDirection(normal).scale(ring.innerRadius);
    const nearestHeight = clamp(projection.signedHeight, -ring.halfThickness, ring.halfThickness);

    return ring.center.add(nearestPlanarPosition).add(normal.scale(nearestHeight));
}

/**
 * Measures the shortest Euclidean distance from a point to the ring volume.
 * @param position World-space point to measure from.
 * @param ring Ring volume used to find the nearest point.
 * @returns Distance in the same world units as the ring dimensions.
 */
export function distanceToRingVolume(position: Vector3, ring: RingVolume): number {
    return Vector3.Distance(position, getNearestPointOnRingVolume(position, ring));
}

/**
 * Chooses a stable unit direction in the ring plane when the point is on its axis.
 * @param normal Normalized ring-plane normal.
 * @returns Unit vector perpendicular to the normal.
 */
function getFallbackRingPlanarDirection(normal: Vector3): Vector3 {
    const fallback = Math.abs(normal.x) < 0.9 ? Vector3.Right() : Vector3.Up();
    return fallback.subtract(normal.scale(Vector3.Dot(fallback, normal))).normalize();
}

/**
 * Normalizes the ring normal, defaulting to world up for a zero vector.
 * @param ring Ring whose plane normal is used.
 * @returns Unit normal of the ring plane.
 */
function getRingNormal(ring: RingVolume): Vector3 {
    const normalLengthSquared = ring.normal.lengthSquared();
    if (normalLengthSquared === 0) {
        return Vector3.Up();
    }

    return ring.normal.scale(1 / Math.sqrt(normalLengthSquared));
}
