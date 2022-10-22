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

