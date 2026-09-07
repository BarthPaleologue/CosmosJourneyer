import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { Target } from "../../gameplay/targeting/target";
import { computeReticleMatch, getPreciseAimSinSquared } from "./computeReticleMatch";

export type ReticleRay = {
    readonly origin: Vector3;
    readonly direction: Vector3;
};

/** Resolves only the supplied candidates. Equal scores preserve their order. No UI or selection state is read. */
export function resolveReticleTarget(targets: Iterable<Target>, ray: ReticleRay, verticalFov: number): Target | null {
    const directionLength = ray.direction.length();
    if (directionLength <= 0 || !Number.isFinite(directionLength)) {
        return null;
    }
    const preciseAimSinSquared = getPreciseAimSinSquared(verticalFov);
    const rayDirection = ray.direction.scale(1 / directionLength);
    let bestPreciseScore = Infinity;
    let bestAssistedScore = Infinity;
    let preciseTarget: Target | null = null;
    let assistedTarget: Target | null = null;
    const toTarget = Vector3.Zero();
    for (const target of targets) {
        const transform = target.getTransform();
        transform.computeWorldMatrix(true);
        transform.getAbsolutePosition().subtractToRef(ray.origin, toTarget);
        const match = computeReticleMatch(toTarget, rayDirection, target.getBoundingRadius(), preciseAimSinSquared);
        if (match === null) {
            continue;
        }
        if (match.kind === "precise" && match.scoreSquared < bestPreciseScore) {
            bestPreciseScore = match.scoreSquared;
            preciseTarget = target;
        } else if (match.kind === "assisted" && match.scoreSquared < bestAssistedScore) {
            bestAssistedScore = match.scoreSquared;
            assistedTarget = target;
        }
    }
    return preciseTarget ?? assistedTarget;
}
