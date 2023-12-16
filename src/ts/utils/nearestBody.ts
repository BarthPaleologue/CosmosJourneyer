import { AbstractBody } from "../bodies/abstractBody";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { BoundingSphere } from "../bodies/common";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function nearestBody(objectPosition: Vector3, bodies: AbstractBody[]): AbstractBody {
    let distance = -1;
    if (bodies.length === 0) throw new Error("no bodieees !");
    let nearest = bodies[0];
    for (const body of bodies) {
        const newDistance = objectPosition.subtract(body.getTransform().getAbsolutePosition()).length();
        if (distance === -1 || newDistance < distance) {
            nearest = body;
            distance = newDistance;
        }
    }
    return nearest;
}

/**
 * If the parameter is unset, returns whereas the player is orbiting a body, if the parameter is set returns if the player orbits the given body
 * @param controller the controller to check
 * @param body the body to check whereas the player is orbiting
 * @param orbitLimitFactor the boundary of the orbit detection (multiplied by planet radius)
 */
export function isOrbiting(controller: Transformable, body: Transformable & BoundingSphere, orbitLimitFactor = 2.5): boolean {
    return Vector3.DistanceSquared(body.getTransform().getAbsolutePosition(), controller.getTransform().getAbsolutePosition()) < (orbitLimitFactor * body.getBoundingRadius()) ** 2;
}
