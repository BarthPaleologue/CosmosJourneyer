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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemController } from "../starSystem/starSystemController";
import { nearestBody } from "./nearestBody";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";
import { Controls } from "../uberCore/controls";
import { getUpwardDirection, roll, rotateAround } from "../uberCore/transforms/basicTransform";
import { CanHaveRings } from "../architecture/canHaveRings";

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
            .add(lateralDirection.scale(4 * object.getBoundingRadius()));
        //.add(upDirection.scale(1 * object.getBoundingRadius()));
        transformable.getTransform().setAbsolutePosition(displacement);

        rotateAround(transformable.getTransform(), object.getTransform().getAbsolutePosition(), dirBodyToStar, -Math.PI / 16);
    }

    starSystem.translateEverythingNow(transformable.getTransform().getAbsolutePosition().negate());
    transformable.getTransform().setAbsolutePosition(Vector3.Zero());

    const starDirection = nearestStar.getTransform().getAbsolutePosition().subtract(object.getTransform().getAbsolutePosition()).normalize();

    const halfway = object
        .getTransform()
        .getAbsolutePosition()
        .add(starDirection.scale(object.getBoundingRadius() * 4));
    transformable.getTransform().lookAt(halfway);

    transformable.getTransform().computeWorldMatrix(true);

    roll(transformable.getTransform(), -Math.PI / 8);

    transformable.getActiveCameras().forEach((camera) => {
        camera.getViewMatrix(true);
        camera.getProjectionMatrix(true);
    });
}

export function positionNearObjectAsteroidField(body: Transformable & CanHaveRings & BoundingSphere, transformable: Controls, starSystem: StarSystemController): void {
    const asteroidField = body.getAsteroidField();
    if (asteroidField === null) {
        throw new Error("The body does not have an asteroid field");
    }

    const bodyPosition = body.getTransform().getAbsolutePosition();

    const asteroidFieldAverageRadius = asteroidField.averageRadius;

    const nearestStar = nearestBody(bodyPosition, starSystem.stellarObjects);
    const dirToStar = bodyPosition.subtract(nearestStar.getTransform().getAbsolutePosition()).normalize();
    const upDirection = getUpwardDirection(body.getTransform());
    const lateralDirection = Vector3.Cross(dirToStar, upDirection).normalize();

    const targetPosition = bodyPosition.add(lateralDirection.scale(asteroidFieldAverageRadius)).add(upDirection.scale(asteroidField.patchThickness));

    transformable.getTransform().setAbsolutePosition(targetPosition);
    transformable.getTransform().lookAt(bodyPosition);

    starSystem.translateEverythingNow(transformable.getTransform().getAbsolutePosition().negate());
    transformable.getTransform().setAbsolutePosition(Vector3.Zero());

    transformable.getTransform().computeWorldMatrix(true);

    transformable.getActiveCameras().forEach((camera) => {
        camera.getViewMatrix(true);
        camera.getProjectionMatrix(true);
    });
}
