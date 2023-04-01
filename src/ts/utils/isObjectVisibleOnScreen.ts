import { Vector3 } from "@babylonjs/core/Maths/math";
import { BaseObject } from "../orbits/iOrbitalBody";
import { Settings } from "../settings";

/**
 * Checks if the size of the object on the screen is bigger than the threshold
 * @param object The object to check
 * @param cameraPosition The position of the camera
 * @param threshold The size threshold
 * @returns Whether the object is bigger than the threshold
 */
export function isSizeOnScreenEnough(object: BaseObject, cameraPosition: Vector3, threshold = 0.002) {
    const distance = Vector3.Distance(cameraPosition, object.transform.getAbsolutePosition());
    const angularSize = object.getBoundingRadius() * 2 / distance;

    return angularSize / Settings.FOV > threshold;
}