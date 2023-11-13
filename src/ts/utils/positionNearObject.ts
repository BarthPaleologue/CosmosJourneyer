import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractController } from "../controller/uberCore/abstractController";
import { StarSystem } from "../controller/starSystem";
import { nearestBody } from "./nearestBody";
import { BoundingSphere, Transformable } from "../view/common";

export function positionNearObject(controller: AbstractController, object: Transformable & BoundingSphere, starSystem: StarSystem, nRadius = 3): void {
    // go from the nearest star to be on the sunny side of the object
    const nearestStar = nearestBody(object.getTransform(), starSystem.stellarObjects);

    if (nearestStar === object) {
        // the object is the nearest star
        controller.getTransform().setAbsolutePosition(
            object
                .getTransform()
                .getAbsolutePosition()
                .add(new Vector3(0, 0.2, 1).scaleInPlace(object.getBoundingRadius() * nRadius))
        );
    } else {
        const dirBodyToStar = object.getTransform().getAbsolutePosition().subtract(nearestStar.getTransform().getAbsolutePosition());
        const distBodyToStar = dirBodyToStar.length();

        dirBodyToStar.scaleInPlace(1 / distBodyToStar);
        const displacement = nearestStar
            .getTransform()
            .getAbsolutePosition()
            .add(dirBodyToStar.scale(distBodyToStar - nRadius * object.getBoundingRadius()));
        controller.getTransform().setAbsolutePosition(displacement);
    }

    starSystem.translateEverythingNow(controller.getTransform().getAbsolutePosition().negate());
    controller.getTransform().setAbsolutePosition(Vector3.Zero());

    controller.getTransform().lookAt(object.getTransform().getAbsolutePosition());
}
