import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/** Scores a world-space offset against a normalized ray, independently of contact availability. */
export function computeTargetScore(
    toTarget: Vector3,
    rayDirection: Vector3,
    radius: number,
    verticalFov: number,
): number {
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
