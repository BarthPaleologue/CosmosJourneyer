import { ITransformLike } from "../uberCore/transforms/ITransformLike";
import { AbstractBody } from "../bodies/abstractBody";
import { AbstractController } from "../uberCore/abstractController";

export function nearestBody(object: ITransformLike, bodies: AbstractBody[]): AbstractBody {
    let distance = -1;
    if (bodies.length === 0) throw new Error("no bodieees !");
    let nearest = bodies[0];
    for (const body of bodies) {
        const newDistance = object.getAbsolutePosition().subtract(body.transform.getAbsolutePosition()).length();
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
export function isOrbiting(controller: AbstractController, body: AbstractBody, orbitLimitFactor = 2.5): boolean {
    return body.transform.getAbsolutePosition().subtract(controller.transform.getAbsolutePosition()).lengthSquared() < (orbitLimitFactor * body.getRadius()) ** 2;
}
