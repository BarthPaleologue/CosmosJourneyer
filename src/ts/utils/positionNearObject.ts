//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StarSystemController } from "../starSystem/starSystemController";
import { nearestBody } from "./nearestBody";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";

export function positionNearObject(transformable: Transformable, object: Transformable & BoundingSphere, starSystem: StarSystemController, nRadius = 3): void {
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
