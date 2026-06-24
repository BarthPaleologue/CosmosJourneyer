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

export function isInsideRingRadialBounds(planarDistance: number, ring: RingVolume): boolean {
    return planarDistance > ring.innerRadius && planarDistance < ring.outerRadius;
}

export function isPositionInsideRingVolume(position: Vector3, ring: RingVolume): boolean {
    const projection = projectPositionOnRingPlane(position, ring);
    return (
        Math.abs(projection.signedHeight) < ring.halfThickness &&
        isInsideRingRadialBounds(projection.planarDistance, ring)
    );
}

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

export function distanceToRingVolume(position: Vector3, ring: RingVolume): number {
    return Vector3.Distance(position, getNearestPointOnRingVolume(position, ring));
}

function getFallbackRingPlanarDirection(normal: Vector3): Vector3 {
    const fallback = Math.abs(normal.x) < 0.9 ? Vector3.Right() : Vector3.Up();
    return fallback.subtract(normal.scale(Vector3.Dot(fallback, normal))).normalize();
}

function getRingNormal(ring: RingVolume): Vector3 {
    const normalLengthSquared = ring.normal.lengthSquared();
    if (normalLengthSquared === 0) {
        return Vector3.Up();
    }

    return ring.normal.scale(1 / Math.sqrt(normalLengthSquared));
}
