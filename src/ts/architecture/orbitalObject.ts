import { Transformable } from "./transformable";
import { BoundingSphere } from "./boundingSphere";
import { OrbitProperties } from "../orbit/orbitProperties";
import { rotateVector3AroundInPlace } from "../utils/algebra";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math";
import { getRotationQuaternion, setRotationQuaternion, translate } from "../uberCore/transforms/basicTransform";
import { PhysicalProperties } from "../model/common";

export interface OrbitalObject extends Transformable, BoundingSphere {
    name: string;

    getRotationAxis(): Vector3;

    getOrbitProperties(): OrbitProperties;

    getPhysicalProperties(): PhysicalProperties;

    parent: OrbitalObject | null;
}

export class OrbitalObject {
    static getRotationAxis(object: OrbitalObject) {
        return object.getTransform().up;
    }

    static computeNextOrbitalPosition(object: OrbitalObject, deltaTime: number) {
        const orbit = object.getOrbitProperties();
        if (orbit.period === 0 || object.parent === null) return object.getTransform().getAbsolutePosition();

        const barycenter = object.parent.getTransform().getAbsolutePosition();

        // enforce distance to orbit center
        const oldPosition = object.getTransform().getAbsolutePosition().subtract(barycenter);
        const newPosition = oldPosition.clone();

        // rotate the object around the barycenter of the orbit, around the normal to the orbital plane
        const dtheta = (2 * Math.PI * deltaTime) / orbit.period;
        rotateVector3AroundInPlace(newPosition, barycenter, orbit.normalToPlane, dtheta);

        newPosition.normalize().scaleInPlace(orbit.radius);

        // enforce orbital plane
        const correctionAxis = Vector3.Cross(orbit.normalToPlane, newPosition.normalizeToNew());
        const correctionAngle = 0.5 * Math.PI - Vector3.GetAngleBetweenVectors(orbit.normalToPlane, newPosition.normalizeToNew(), correctionAxis);
        newPosition.applyRotationQuaternionInPlace(Quaternion.RotationAxis(correctionAxis, correctionAngle));

        return newPosition.addInPlace(barycenter);
    }

    static updateOrbitalPosition(object: OrbitalObject, deltaTime: number) {
        const orbit = object.getOrbitProperties();
        if (orbit.period === 0 || object.parent === null) return;

        const oldPosition = object.getTransform().getAbsolutePosition();
        const newPosition = OrbitalObject.computeNextOrbitalPosition(object, deltaTime);
        translate(object.getTransform(), newPosition.subtractInPlace(oldPosition));
    }

    static getDeltaTheta(object: OrbitalObject, deltaTime: number) {
        if (object.getPhysicalProperties().rotationPeriod === 0) return 0;
        return (2 * Math.PI * deltaTime) / object.getPhysicalProperties().rotationPeriod;
    }

    /**
     * Updates the rotation of the body around its axis
     * @param object
     * @param deltaTime The time elapsed since the last update
     * @returns The elapsed angle of rotation around the axis
     */
    static updateRotation(object: OrbitalObject, deltaTime: number) {
        const dtheta = OrbitalObject.getDeltaTheta(object, deltaTime);
        if (dtheta === 0) return;

        const elementaryRotationQuaternion = Quaternion.RotationAxis(OrbitalObject.getRotationAxis(object), dtheta);
        const newQuaternion = elementaryRotationQuaternion.multiply(getRotationQuaternion(object.getTransform()));

        setRotationQuaternion(object.getTransform(), newQuaternion);
    }
}
