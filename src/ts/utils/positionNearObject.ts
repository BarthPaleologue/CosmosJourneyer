import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemController } from "../starSystem/starSystemController";
import { nearestBody } from "./nearestBody";
import { getUpwardDirection, roll, Transformable } from "../uberCore/transforms/basicTransform";
import { BoundingSphere } from "../bodies/common";

export function positionNearObjectBrightSide(transformable: Transformable, object: Transformable & BoundingSphere, starSystem: StarSystemController, nRadius = 3): void {
    // go from the nearest star to be on the sunny side of the object
    const nearestStar = nearestBody(object.getTransform().getAbsolutePosition(), starSystem.stellarObjects);

    if (nearestStar === object) {
        // the object is the nearest star
        transformable.getTransform().setAbsolutePosition(
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
        transformable.getTransform().setAbsolutePosition(displacement);
    }

    starSystem.translateEverythingNow(transformable.getTransform().getAbsolutePosition().negate());
    transformable.getTransform().setAbsolutePosition(Vector3.Zero());

    transformable.getTransform().lookAt(object.getTransform().getAbsolutePosition());
}

export function positionNearObjectWithStarVisible(transformable: Transformable, object: Transformable & BoundingSphere, starSystem: StarSystemController, nRadius = 3): void {
    // go from the nearest star to be on the sunny side of the object
    const nearestStar = nearestBody(object.getTransform().getAbsolutePosition(), starSystem.stellarObjects);

    if (nearestStar === object) {
        // the object is the nearest star
        transformable.getTransform().setAbsolutePosition(
            object
                .getTransform()
                .getAbsolutePosition()
                .add(new Vector3(0, 0.2, 1).scaleInPlace(object.getBoundingRadius() * nRadius))
        );
    } else {
        const dirBodyToStar = object.getTransform().getAbsolutePosition().subtract(nearestStar.getTransform().getAbsolutePosition());
        const distBodyToStar = dirBodyToStar.length();
        dirBodyToStar.scaleInPlace(1 / distBodyToStar);

        const upDirection = getUpwardDirection(object.getTransform());
        const lateralDirection = Vector3.Cross(dirBodyToStar, upDirection);

        const displacement = nearestStar
            .getTransform()
            .getAbsolutePosition()
            .add(dirBodyToStar.scale(distBodyToStar + 1.5 * object.getBoundingRadius()))
            .add(lateralDirection.scale(3 * object.getBoundingRadius()))
            //.add(upDirection.scale(1 * object.getBoundingRadius()));
        transformable.getTransform().setAbsolutePosition(displacement);
    }

    starSystem.translateEverythingNow(transformable.getTransform().getAbsolutePosition().negate());
    transformable.getTransform().setAbsolutePosition(Vector3.Zero());

    const halfway = Vector3.Lerp(object.getTransform().getAbsolutePosition(), nearestStar.getTransform().getAbsolutePosition(), 6e-4);

    transformable.getTransform().lookAt(halfway);
    //roll(transformable.getTransform(), Math.PI / 8);
}