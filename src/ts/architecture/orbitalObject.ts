//  This file is part of Cosmos Journeyer
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

import { Transformable } from "./transformable";
import { BoundingSphere } from "./boundingSphere";
import { OrbitProperties } from "../orbit/orbitProperties";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math";
import { getRotationQuaternion, setRotationQuaternion, translate } from "../uberCore/transforms/basicTransform";
import { OrbitalObjectPhysicalProperties } from "./physicalProperties";
import { TypedObject } from "./typedObject";

/**
 * Describes all objects that can have an orbital trajectory and rotate on themselves
 */
export interface OrbitalObject extends Transformable, BoundingSphere, TypedObject {
    /**
     * The name of the object
     */
    readonly name: string;

    /**
     * The rotation axis around which the object rotates on itself
     */
    getRotationAxis(): Vector3;

    /**
     * Returns the orbital properties of the object
     */
    getOrbitProperties(): OrbitProperties;

    /**
     * Returns the physical properties of the object
     */
    getPhysicalProperties(): OrbitalObjectPhysicalProperties;

    /**
     * Returns the parent of the object
     */
    parent: OrbitalObject | null;
}

export class OrbitalObject {
    /**
     * Returns the next position of the object on its orbit. This does not update the position of the object (see UpdateOrbitalPosition)
     * @param object The object we want to compute the next position of
     * @param deltaTime The time elapsed since the last update
     * @constructor
     */
    static GetNextOrbitalPosition(object: OrbitalObject, deltaTime: number): Vector3 {
        const orbit = object.getOrbitProperties();
        if (orbit.period === 0 || object.parent === null) return object.getTransform().getAbsolutePosition();

        const barycenter = object.parent.getTransform().getAbsolutePosition();

        // enforce distance to orbit center
        const oldPosition = object.getTransform().getAbsolutePosition().subtract(barycenter);
        const newPosition = oldPosition.clone();

        // rotate the object around the barycenter of the orbit, around the normal to the orbital plane
        const dtheta = (2 * Math.PI * deltaTime) / orbit.period;
        const rotationQuaternion = Quaternion.RotationAxis(orbit.normalToPlane, dtheta);
        newPosition.applyRotationQuaternionInPlace(rotationQuaternion);
        newPosition.normalize().scaleInPlace(orbit.radius);

        // enforce orbital plane
        const correctionAxis = Vector3.Cross(orbit.normalToPlane, newPosition.normalizeToNew());
        const correctionAngle = 0.5 * Math.PI - Vector3.GetAngleBetweenVectors(orbit.normalToPlane, newPosition.normalizeToNew(), correctionAxis);
        newPosition.applyRotationQuaternionInPlace(Quaternion.RotationAxis(correctionAxis, correctionAngle));

        return newPosition.addInPlace(barycenter);
    }

    /**
     * Updates the position of the object on its orbit (under the hood calls GetNextOrbitalPosition)
     * @param object The object we want to update the position of
     * @param deltaTime The time elapsed since the last update
     * @constructor
     */
    static UpdateOrbitalPosition(object: OrbitalObject, deltaTime: number): void {
        const orbit = object.getOrbitProperties();
        if (orbit.period === 0 || object.parent === null) return;

        const oldPosition = object.getTransform().getAbsolutePosition();
        const newPosition = OrbitalObject.GetNextOrbitalPosition(object, deltaTime);
        translate(object.getTransform(), newPosition.subtractInPlace(oldPosition));
    }

    /**
     * Computes the rotation to apply in the current frame to the object around its axis. This does not update the rotation of the object (see UpdateRotation)
     * @param object The object we want to compute the rotation of
     * @param deltaTime The time elapsed since the last update
     * @constructor
     */
    static GetRotationAngle(object: OrbitalObject, deltaTime: number): number {
        if (object.getPhysicalProperties().rotationPeriod === 0) return 0;
        return (2 * Math.PI * deltaTime) / object.getPhysicalProperties().rotationPeriod;
    }

    /**
     * Updates the rotation of the body around its axis
     * @param object
     * @param deltaTime The time elapsed since the last update
     * @constructor
     */
    static UpdateRotation(object: OrbitalObject, deltaTime: number): void {
        const dtheta = OrbitalObject.GetRotationAngle(object, deltaTime);
        if (dtheta === 0) return;

        const elementaryRotationQuaternion = Quaternion.RotationAxis(object.getRotationAxis(), dtheta);
        const newQuaternion = elementaryRotationQuaternion.multiply(getRotationQuaternion(object.getTransform()));

        setRotationQuaternion(object.getTransform(), newQuaternion);
    }
}

/**
 * Describes the model of an orbital object
 */
export interface OrbitalObjectModel {
    /**
     * The random number generator used by the model to generate internal values
     * @param step The sample step of the random number generator (use squirrel noise for example)
     */
    readonly rng: (step: number) => number;

    /**
     * The seed used by the random number generator
     */
    readonly seed: number;

    /**
     * Orbit properties of the object
     */
    readonly orbit: OrbitProperties;

    /**
     * Physical properties of the object
     */
    readonly physicalProperties: OrbitalObjectPhysicalProperties;

    /**
     * The model of the parent object if the object is to have a parent, null otherwise
     */
    readonly parentBody: OrbitalObjectModel | null;

    /**
     * The models of the children objects of the object
     */
    readonly childrenBodies: OrbitalObjectModel[];
}
