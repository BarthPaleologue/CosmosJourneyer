import { AbstractBody } from "../bodies/abstractBody";
import { Vector3 } from "@babylonjs/core";
import { AbstractController } from "../uberCore/abstractController";
import { StarSystem } from "../bodies/starSystem";
import { nearestBody } from "./nearestBody";

export function positionNearBody(controller: AbstractController, body: AbstractBody, starSystem: StarSystem, nRadius = 3): void {
    const nearestStar = nearestBody(body.transform, starSystem.stars);
    const dirBodyToStar = body.transform.getAbsolutePosition().subtract(nearestStar.transform.getAbsolutePosition());
    const distBodyToStar = dirBodyToStar.length();

    if (distBodyToStar > 0) {
        dirBodyToStar.scaleInPlace(1 / distBodyToStar);
        const displacement = nearestStar.transform.getAbsolutePosition().add(dirBodyToStar.scale(distBodyToStar - nRadius * body.getRadius()));
        controller.transform.setAbsolutePosition(displacement);
    } else {
        controller.transform.setAbsolutePosition(body.transform.getAbsolutePosition().add(new Vector3(0, 0.2, 1).scaleInPlace(body.getRadius() * nRadius)));
    }

    starSystem.translateAllBodies(controller.transform.getAbsolutePosition().negate());
    controller.transform.translate(controller.transform.getAbsolutePosition().negate());

    controller.transform.node.lookAt(body.transform.getAbsolutePosition());
}
