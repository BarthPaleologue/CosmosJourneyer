//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Lerp } from "@babylonjs/core/Maths/math.scalar.functions";
import { Vector3, type Quaternion } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { type Controls } from "@/frontend/controls";
import { lookAt, roll, rotateAround, setRotationQuaternion } from "@/frontend/helpers/transform";
import { type CanHaveRings } from "@/frontend/universe/architecture/canHaveRings";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type Transformable } from "@/frontend/universe/architecture/transformable";
import { type StarSystemController } from "@/frontend/universe/starSystemController";

export function nearestObject(objectPosition: Vector3, bodies: ReadonlyArray<Transformable>): Transformable {
    let distance = -1;
    let nearest = bodies[0];
    if (nearest === undefined) throw new Error("no bodieees !");
    for (const body of bodies) {
        const newDistance = objectPosition.subtract(body.getTransform().getAbsolutePosition()).length();
        if (distance === -1 || newDistance < distance) {
            nearest = body;
            distance = newDistance;
        }
    }
    return nearest;
}

export function positionNearObject(
    orbitalObject: Transformable & HasBoundingSphere,
    localPosition: Vector3,
    localRotation: Quaternion,
    transform: TransformNode,
) {
    const objectRadius = orbitalObject.getBoundingRadius();
    const currentDistance = localPosition.length();

    const safetyFactor = 2;

    const targetDistance = Math.max(objectRadius * safetyFactor, currentDistance);

    const scalingFactor = targetDistance / (currentDistance + 0.0001);

    const objectWorld = orbitalObject.getTransform().getWorldMatrix();
    const worldPosition = Vector3.TransformCoordinates(localPosition.scale(scalingFactor), objectWorld);
    transform.setAbsolutePosition(worldPosition);

    const objectQuaternion = orbitalObject.getTransform().absoluteRotationQuaternion;
    const worldRotation = localRotation.multiply(objectQuaternion);
    setRotationQuaternion(transform, worldRotation);
}

export function positionNearObjectBrightSide(
    transformable: Transformable,
    object: Transformable & HasBoundingSphere,
    starSystem: StarSystemController,
    nRadius = 3,
): void {
    // go from the nearest star to be on the sunny side of the object
    const nearestStar = nearestObject(object.getTransform().getAbsolutePosition(), starSystem.getStellarObjects());

    if (nearestStar === object) {
        // the object is the nearest star
        transformable.getTransform().setAbsolutePosition(
            object
                .getTransform()
                .getAbsolutePosition()
                .add(new Vector3(0, 0.2, 1).scaleInPlace(object.getBoundingRadius() * nRadius)),
        );
    } else {
        const dirBodyToStar = object
            .getTransform()
            .getAbsolutePosition()
            .subtract(nearestStar.getTransform().getAbsolutePosition());
        const distBodyToStar = dirBodyToStar.length();

        dirBodyToStar.scaleInPlace(1 / distBodyToStar);
        const displacement = nearestStar
            .getTransform()
            .getAbsolutePosition()
            .add(dirBodyToStar.scale(distBodyToStar - nRadius * object.getBoundingRadius()));
        transformable.getTransform().setAbsolutePosition(displacement);
    }

    lookAt(
        transformable.getTransform(),
        object.getTransform().getAbsolutePosition(),
        transformable.getTransform().getScene().useRightHandedSystem,
    );
}

export function positionNearObjectWithStarVisible(
    transformable: Controls,
    object: Transformable & HasBoundingSphere,
    starSystem: StarSystemController,
    nRadius = 3,
): void {
    // go from the nearest star to be on the sunny side of the object
    const nearestStar = nearestObject(object.getTransform().getAbsolutePosition(), starSystem.getStellarObjects());

    if (nearestStar === object) {
        // the object is the nearest star
        transformable.getTransform().setAbsolutePosition(
            object
                .getTransform()
                .getAbsolutePosition()
                .add(new Vector3(0, 0.2, 1).scaleInPlace(object.getBoundingRadius() * nRadius)),
        );
    } else {
        const dirBodyToStar = object
            .getTransform()
            .getAbsolutePosition()
            .subtract(nearestStar.getTransform().getAbsolutePosition());
        const distBodyToStar = dirBodyToStar.length();
        dirBodyToStar.scaleInPlace(1 / distBodyToStar);

        const upDirection = object.getTransform().up;
        const lateralDirection = Vector3.Cross(dirBodyToStar, upDirection);

        const displacement = nearestStar
            .getTransform()
            .getAbsolutePosition()
            .add(dirBodyToStar.scale(distBodyToStar + 1.5 * object.getBoundingRadius()))
            .add(lateralDirection.scale(4 * object.getBoundingRadius()));
        //.add(upDirection.scale(1 * object.getBoundingRadius()));
        transformable.getTransform().setAbsolutePosition(displacement);

        rotateAround(
            transformable.getTransform(),
            object.getTransform().getAbsolutePosition(),
            dirBodyToStar,
            -Math.PI / 16,
        );
    }

    const starDirection = nearestStar
        .getTransform()
        .getAbsolutePosition()
        .subtract(object.getTransform().getAbsolutePosition())
        .normalize();

    const halfway = object
        .getTransform()
        .getAbsolutePosition()
        .add(starDirection.scale(object.getBoundingRadius() * 4));
    lookAt(transformable.getTransform(), halfway, transformable.getTransform().getScene().useRightHandedSystem);

    transformable.getTransform().computeWorldMatrix(true);

    roll(transformable.getTransform(), -Math.PI / 8);

    transformable.getActiveCamera().getViewMatrix(true);
    transformable.getActiveCamera().getProjectionMatrix(true);
}

export function positionNearObjectAsteroidField(
    body: Transformable & CanHaveRings & HasBoundingSphere,
    starSystem: StarSystemController,
    t: number,
): Vector3 {
    const asteroidField = body.asteroidField;
    if (asteroidField === null) {
        throw new Error("The body does not have an asteroid field");
    }

    const bodyPosition = body.getTransform().getAbsolutePosition();

    const distanceToPlanet = Lerp(asteroidField.innerRadius, asteroidField.outerRadius, t);

    const nearestStar = nearestObject(bodyPosition, starSystem.getStellarObjects());
    const dirToStar = bodyPosition.subtract(nearestStar.getTransform().getAbsolutePosition()).normalize();
    const upDirection = body.getTransform().up;
    const lateralDirection = Vector3.Cross(dirToStar, upDirection).normalize();

    return bodyPosition
        .add(lateralDirection.scale(distanceToPlanet))
        .add(upDirection.scale(asteroidField.patchThickness));
}
