import { Vector3 } from "@babylonjs/core/Maths/math";
import { BoundingSphere, Transformable } from "../view/common";
import { Camera } from "@babylonjs/core/Cameras/camera";

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
