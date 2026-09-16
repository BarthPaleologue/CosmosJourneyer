import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { Target } from "../../targeting/target";

export type Ray = {
    origin: Vector3;
    direction: Vector3;
};

export function findBestTarget(
    targets: Iterable<Target>,
    ray: Readonly<Ray>,
    verticalFov: number,
    minimumScore: number,
): Target | null {
    const rayDirection = ray.direction;
    let bestScore = 0;
    let bestTarget: Target | null = null;
    const toTarget = Vector3.Zero();
    for (const target of targets) {
        const transform = target.getTransform();
        transform.computeWorldMatrix(true);
        transform.getAbsolutePosition().subtractToRef(ray.origin, toTarget);
        const score = computeTargetScore(toTarget, rayDirection, target.getBoundingRadius(), verticalFov);
        if (score > bestScore) {
            bestScore = score;
            bestTarget = target;
        }
    }

    if (bestScore < minimumScore) {
        return null;
    }

    return bestTarget;
}

/** Scores a world-space offset against a normalized ray, independently of contact availability. */
function computeTargetScore(toTarget: Vector3, rayDirection: Vector3, radius: number, verticalFov: number): number {
    const forwardDistance = Vector3.Dot(toTarget, rayDirection);
    if (forwardDistance <= 0) {
        return 0;
    }

    const forwardDistance2 = forwardDistance ** 2;
    const distance2 = toTarget.lengthSquared();
    const missDistance2 = Math.max(0, distance2 - forwardDistance2);

    const tanHalfFov = Math.tan(verticalFov / 2);

    const tanDeviation2 = missDistance2 / forwardDistance2;
    const misalignmentScore = tanDeviation2 / tanHalfFov ** 2;

    const tanAngularSize = radius / Math.sqrt(distance2);
    const uselessnessScore = tanAngularSize / tanHalfFov;

    return 1 / (1 + uselessnessScore + misalignmentScore);
}
