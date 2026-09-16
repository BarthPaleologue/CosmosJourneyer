import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { Target } from "../../targeting/target";
import { computeTargetScore } from "./computeTargetScore";

export type ReticleRay = {
    readonly origin: Vector3;
    readonly direction: Vector3;
};

/** Resolves only the supplied candidates. Equal scores preserve their order. No UI or selection state is read. */
export function resolveReticleTarget(targets: Iterable<Target>, ray: ReticleRay, verticalFov: number): Target | null {
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

    return bestTarget;
}
