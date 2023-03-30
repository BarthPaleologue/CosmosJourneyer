import { AbstractBody } from "../bodies/abstractBody";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractController } from "../uberCore/abstractController";
import { StarSystem } from "../bodies/starSystem";
import { nearestBody } from "./nearestBody";
import { AbstractObject } from "../bodies/abstractObject";

export function positionNearBody(controller: AbstractController, body: AbstractObject, starSystem: StarSystem, nRadius = 3): void {
    const nearestStar = nearestBody(body.transform, starSystem.stellarObjects);
    const dirBodyToStar = body.transform.getAbsolutePosition().subtract(nearestStar.transform.getAbsolutePosition());
    const distBodyToStar = dirBodyToStar.length();

    if (distBodyToStar > 0) {
        dirBodyToStar.scaleInPlace(1 / distBodyToStar);
        const displacement = nearestStar.transform.getAbsolutePosition().add(dirBodyToStar.scale(distBodyToStar - nRadius * body.getBoundingRadius()));
        controller.transform.setAbsolutePosition(displacement);
    } else {
        controller.transform.setAbsolutePosition(body.transform.getAbsolutePosition().add(new Vector3(0, 0.2, 1).scaleInPlace(body.getBoundingRadius() * nRadius)));
    }

    starSystem.translateEverythingNow(controller.transform.getAbsolutePosition().negate());
    controller.transform.translate(controller.transform.getAbsolutePosition().negate());

    controller.transform.node.lookAt(body.transform.getAbsolutePosition());
}
