import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemController } from "../starSystem/starSystemController";
import { nearestBody } from "./nearestBody";
import {
    getForwardDirection,
    getUpwardDirection,
    roll,
    rotateAround,
    Transformable
} from "../uberCore/transforms/basicTransform";
import { BoundingSphere } from "../bodies/common";
import { Controls } from "../uberCore/controls";
import { Matrix } from "@babylonjs/core/Maths/math";
import { Scene } from "@babylonjs/core/scene";
import { MapVector3 } from "./algebra";
import { clamp } from "./math";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Assets } from "../assets";

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

export function positionNearObjectWithStarVisible(transformable: Controls, object: Transformable & BoundingSphere, starSystem: StarSystemController, nRadius = 3): void {
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
            .add(lateralDirection.scale(3 * object.getBoundingRadius()));
        //.add(upDirection.scale(1 * object.getBoundingRadius()));
        transformable.getTransform().setAbsolutePosition(displacement);

        rotateAround(transformable.getTransform(), object.getTransform().getAbsolutePosition(), dirBodyToStar, -Math.PI / 16);
    }

    starSystem.translateEverythingNow(transformable.getTransform().getAbsolutePosition().negate());
    transformable.getTransform().setAbsolutePosition(Vector3.Zero());

    const starDirection = nearestStar.getTransform().getAbsolutePosition().subtract(object.getTransform().getAbsolutePosition()).normalize();

    const halfway = object.getTransform().getAbsolutePosition().add(starDirection.scale(object.getBoundingRadius() * 4)); //Vector3.Lerp(object.getTransform().getAbsolutePosition(), nearestStar.getTransform().getAbsolutePosition(), 0.0005);
    transformable.getTransform().lookAt(halfway);

    transformable.getTransform().computeWorldMatrix(true);

    roll(transformable.getTransform(), -Math.PI / 8);

    transformable.getActiveCamera().getViewMatrix(true);
    transformable.getActiveCamera().getProjectionMatrix(true);

    /*const objectScreenCoordinates = Vector3.Project(
        Vector3.Zero(),
        object.getTransform().computeWorldMatrix(true),
        transformable.getActiveCamera().getTransformationMatrix(),
        transformable.getActiveCamera().viewport
    );

    const starScreenCoordinates = Vector3.Project(
        Vector3.Zero(),
        nearestStar.getTransform().computeWorldMatrix(true),
        transformable.getActiveCamera().getTransformationMatrix(),
        transformable.getActiveCamera().viewport
    );

    // make both object and star visible on screen
    const midUV = Vector3.Lerp(objectScreenCoordinates, starScreenCoordinates, -200.0); // ??????????
    console.log(midUV);
    const midPoint = MapVector3(midUV, (x) => x * 2 - 1); //Vector3.Lerp(objectScreenCoordinates, starScreenCoordinates, 0.5);
    midPoint.z = midPoint.z * 0.5 + 0.5;
    midPoint.y *= -1;
    //midPoint.x *= -1;
    console.log(midPoint);

    const midPointUnProjected = Vector3.TransformCoordinates(midPoint, transformable.getActiveCamera().getProjectionMatrix().clone().invert());
    const midPointWorld = Vector3.TransformCoordinates(midPointUnProjected, transformable.getActiveCamera().getViewMatrix().clone().invert());

    transformable.getTransform().lookAt(midPointWorld);

    transformable.getTransform().computeWorldMatrix(true);
    transformable.getActiveCamera().getViewMatrix(true);
    transformable.getActiveCamera().getProjectionMatrix(true);

    const newScreenSpacePosition = Vector3.Project(
        midPointWorld,
        Matrix.IdentityReadOnly,
        transformable.getActiveCamera().getTransformationMatrix(),
        transformable.getActiveCamera().viewport
    );

    console.log(newScreenSpacePosition);

    console.log(getForwardDirection(transformable.getTransform()).dot(midPointWorld.subtract(transformable.getTransform().getAbsolutePosition()).normalize()));
    if (midUV.z < 0.0) {
        console.log("Object is behind camera");
        transformable.getTransform().lookAt(midPointWorld.negate());

        transformable.getTransform().computeWorldMatrix(true);
        transformable.getActiveCamera().getViewMatrix(true);
        transformable.getActiveCamera().getProjectionMatrix(true);
    }*/
}
