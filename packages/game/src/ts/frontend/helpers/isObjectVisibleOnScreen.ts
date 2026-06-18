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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math";

import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

export function getProjectedDiameter01(
    position: Vector3,
    radius: number,
    cameraPosition: Vector3,
    fov: number,
): number {
    const distance = Vector3.Distance(position, cameraPosition);
    if (distance <= radius) {
        return Number.POSITIVE_INFINITY;
    }

    const angularDiameter = 2 * Math.atan(radius / distance);
    return angularDiameter / fov;
}

/**
 * Checks if the size of the object on the screen is bigger than the threshold
 * @param object The object to check
 * @param camera The camera looking at the object
 * @param threshold The size threshold
 * @returns Whether the object is bigger than the threshold
 */
export function isSizeOnScreenEnough(object: HasBoundingSphere & Transformable, camera: Camera, threshold = 0.005) {
    const angularSize = getProjectedDiameter01(
        object.getTransform().getAbsolutePosition(),
        object.getBoundingRadius(),
        camera.globalPosition,
        camera.fov,
    );

    return angularSize > threshold;
}
