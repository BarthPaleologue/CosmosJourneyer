import { Vector3 } from "@babylonjs/core/Maths/math.vector";

// Radius of the precise capture region as a fraction of the full viewport height.
const preciseAimHeightFraction = 0.25;

export function getPreciseAimSinSquared(verticalFov: number): number {
    const tangent = 2 * preciseAimHeightFraction * Math.tan(verticalFov / 2);
    return (tangent * tangent) / (1 + tangent * tangent);
}

export type ReticleMatch = {
    readonly kind: "precise" | "assisted";
    readonly scoreSquared: number;
};

/** Scores a world-space offset against a normalized ray, independently of contact availability. */
export function computeReticleMatch(
    toTarget: Vector3,
    rayDirection: Vector3,
    radius: number,
    preciseAimSinSquared: number,
): ReticleMatch | null {
    if (radius < 0 || !Number.isFinite(radius)) {
        return null;
    }
    const forwardDistance = Vector3.Dot(toTarget, rayDirection);
    if (forwardDistance <= 0) {
        return null;
    }
    const distanceSquared = toTarget.lengthSquared();
    const missDistanceSquared = Vector3.DistanceSquared(toTarget, rayDirection.scale(forwardDistance));
    const angularScoreSquared = missDistanceSquared / distanceSquared;
    if (angularScoreSquared <= preciseAimSinSquared) {
        return { kind: "precise", scoreSquared: angularScoreSquared };
    }
    // Point targets permit precise aim but have no silhouette for assistance.
    if (radius === 0) {
        return null;
    }
    // An enclosing sphere is not a useful silhouette; its center still permits precise aim.
    const radiusSquared = radius * radius;
    if (distanceSquared <= radiusSquared) {
        return null;
    }
    const scoreSquared = missDistanceSquared / radiusSquared;
    return scoreSquared <= 1 ? { kind: "assisted", scoreSquared } : null;
}
