import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractController } from "../controller/uberCore/abstractController";
import { StarSystem } from "../controller/starSystem";
import { nearestBody } from "./nearestBody";
import { AbstractObject } from "../view/bodies/abstractObject";

export function positionNearObject(controller: AbstractController, object: AbstractObject, starSystem: StarSystem, nRadius = 3): void {
    // go from the nearest star to be on the sunny side of the object
    const nearestStar = nearestBody(object.transform, starSystem.stellarObjects);

    if (nearestStar === object) {
        // the object is the nearest star
        controller.aggregate.transformNode.setAbsolutePosition(object.transform.getAbsolutePosition().add(new Vector3(0, 0.2, 1).scaleInPlace(object.getBoundingRadius() * nRadius)));
    } else {
        const dirBodyToStar = object.transform.getAbsolutePosition().subtract(nearestStar.transform.getAbsolutePosition());
        const distBodyToStar = dirBodyToStar.length();

        dirBodyToStar.scaleInPlace(1 / distBodyToStar);
        const displacement = nearestStar.transform.getAbsolutePosition().add(dirBodyToStar.scale(distBodyToStar - nRadius * object.getBoundingRadius()));
        controller.aggregate.transformNode.setAbsolutePosition(displacement);
    }

    starSystem.translateEverythingNow(controller.aggregate.transformNode.getAbsolutePosition().negate());
    controller.aggregate.transformNode.setAbsolutePosition(Vector3.Zero());

    controller.aggregate.transformNode.lookAt(object.transform.getAbsolutePosition());
}
