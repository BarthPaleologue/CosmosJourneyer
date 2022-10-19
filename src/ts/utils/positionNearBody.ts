import { AbstractBody } from "../bodies/abstractBody";
import { Vector3 } from "@babylonjs/core";
import { AbstractController } from "../controllers/abstractController";
import { StarSystem } from "../bodies/starSystem";

export function positionNearBody(controller: AbstractController, body: AbstractBody, starSystem: StarSystem, nRadius = 3): void {
    const dir = body.getAbsolutePosition().clone();
    const dist = dir.length();
    if (dist > 0) {
        dir.normalize();
        controller.transform.setAbsolutePosition(dir.scale(dist - body.getRadius() * nRadius));
    } else {
        controller.transform.setAbsolutePosition(new Vector3(0, 0.2, 1).scaleInPlace(body.getRadius() * nRadius));
    }

    starSystem.translateAllBodies(controller.transform.getAbsolutePosition().negate());
    controller.transform.translate(controller.transform.getAbsolutePosition().negate());

    controller.transform.node.lookAt(body.getAbsolutePosition());
}

/**
 * If the parameter is unset, returns whereas the player is orbiting a body, if the parameter is set returns if the player orbits the given body
 * @param controller the controller to check
 * @param body the body to check whereas the player is orbiting
 * @param orbitLimitFactor the boundary of the orbit detection (multiplied by planet radius)
 */
export function isOrbiting(controller: AbstractController, body: AbstractBody | null = null, orbitLimitFactor = 2.5): boolean {
    if (controller.nearestBody == null) return false;
    else if (body == null) {
        return controller.nearestBody.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * controller.nearestBody.getRadius()) ** 2;
    } else {
        return controller.nearestBody == body && controller.nearestBody.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * controller.nearestBody.getRadius()) ** 2;
    }
}