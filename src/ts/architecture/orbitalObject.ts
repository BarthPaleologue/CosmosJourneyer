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

import { Transformable } from "./transformable";
import { HasBoundingSphere } from "./hasBoundingSphere";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math";
import { getRotationQuaternion, setRotationQuaternion, translate } from "../uberCore/transforms/basicTransform";
import { OrbitalObjectPhysicalProperties } from "./physicalProperties";
import { TypedObject } from "./typedObject";
import { getPointOnOrbit, Orbit } from "../orbit/orbit";

/**
 * Describes all objects that can have an orbital trajectory and rotate on themselves
 */
export interface OrbitalObject extends Transformable, HasBoundingSphere, TypedObject {
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
    getOrbitProperties(): Orbit;

    /**
     * Returns the physical properties of the object
     */
    getPhysicalProperties(): OrbitalObjectPhysicalProperties;

    /**
     * Returns the parent of the object
     */
    parent: OrbitalObject | null;
}

export class OrbitalObjectUtils {
    /**
     * Returns the position of the object on its orbit at a given time. This does not update the position of the object (see SetOrbitalPosition)
     * @param object The object we want to compute the position of
     * @param elapsedSeconds The time elapsed since the beginning of time in seconds
     * @constructor
     */
    static GetOrbitalPosition(object: OrbitalObject, elapsedSeconds: number): Vector3 {
        const orbit = object.getOrbitProperties();
        if (orbit.period === 0 || object.parent === null) return object.getTransform().getAbsolutePosition();

        const barycenter = object.parent.getTransform().getAbsolutePosition();

        return getPointOnOrbit(barycenter, orbit, elapsedSeconds);
    }

    /**
     * Sets the position of the object on its orbit given the elapsed seconds.
     * @param object The object we want to update the position of
     * @param elapsedSeconds The time elapsed since the beginning of time in seconds
     * @constructor
     */
    static SetOrbitalPosition(object: OrbitalObject, elapsedSeconds: number): void {
        const orbit = object.getOrbitProperties();
        if (orbit.period === 0 || object.parent === null) return;

        const oldPosition = object.getTransform().getAbsolutePosition();
        const newPosition = OrbitalObjectUtils.GetOrbitalPosition(object, elapsedSeconds);
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
        const dtheta = OrbitalObjectUtils.GetRotationAngle(object, deltaTime);
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
     * The name of the object
     */
    readonly name: string;

    /**
     * The seed used by the random number generator
     */
    readonly seed: number;

    /**
     * Orbit properties of the object
     */
    readonly orbit: Orbit;

    /**
     * Physical properties of the object
     */
    readonly physicalProperties: OrbitalObjectPhysicalProperties;

    /**
     * The model of the parent object if the object is to have a parent, null otherwise
     */
    readonly parentBody: OrbitalObjectModel | null;

    /**
     * The general name of the object type
     */
    readonly typeName: string;
}
