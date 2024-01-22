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

import { Vector3 } from "@babylonjs/core/Maths/math";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { BoundingSphere } from "../architecture/boundingSphere";
import { Transformable } from "../architecture/transformable";

/**
 * Computes the angular size in radians of an object viewed by a camera
 * @param objectPosition
 * @param objectRadius
 * @param cameraPosition The position of the observer camera
 * @see https://en.wikipedia.org/wiki/Angular_diameter
 */
export function getAngularSize(objectPosition: Vector3, objectRadius: number, cameraPosition: Vector3) {
    const distance = Vector3.Distance(cameraPosition, objectPosition);
    return 2 * Math.atan(objectRadius / distance);
}

/**
 * Checks if the size of the object on the screen is bigger than the threshold
 * @param object The object to check
 * @param camera The camera looking at the object
 * @param threshold The size threshold
 * @returns Whether the object is bigger than the threshold
 */
export function isSizeOnScreenEnough(object: BoundingSphere & Transformable, camera: Camera, threshold = 0.002) {
    const angularSize = getAngularSize(object.getTransform().getAbsolutePosition(), object.getBoundingRadius(), camera.globalPosition);

    return angularSize / camera.fov > threshold;
}
