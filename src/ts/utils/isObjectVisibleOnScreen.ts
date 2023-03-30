import { Vector3 } from "@babylonjs/core/Maths/math";
import { BaseObject } from "../orbits/iOrbitalBody";
import { Settings } from "../settings";

export function isObjectVisibleOnScreen(object: BaseObject, cameraPosition: Vector3) {
    const distance = Vector3.Distance(cameraPosition, object.transform.getAbsolutePosition());
    const angularSize = object.getBoundingRadius() * 2 / distance;

    return angularSize / Settings.FOV > 0.002;
}