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
import { OrbitalObjectPhysicsInfo } from "./physicsInfo";
import { TypedObject } from "./typedObject";
import { getPointOnOrbit, Orbit } from "../orbit/orbit";

/**
 * Describes all objects that can have an orbital trajectory and rotate on themselves
 */
export interface OrbitalObject extends Transformable, HasBoundingSphere, TypedObject {
    readonly model: OrbitalObjectModel;

    /**
     * The rotation axis around which the object rotates on itself
     */
    getRotationAxis(): Vector3;
}

export class OrbitalObjectUtils {
    /**
     * Returns the position of the object on its orbit at a given time. This does not update the position of the object (see SetOrbitalPosition)
     * @param object The object we want to compute the position of
     * @param parents
     * @param elapsedSeconds The time elapsed since the beginning of time in seconds
     * @constructor
     */
    static GetOrbitalPosition(object: OrbitalObject, parents: OrbitalObject[], elapsedSeconds: number): Vector3 {
        const orbit = object.model.orbit;
        if (orbit.period === 0 || parents.length === 0) return object.getTransform().getAbsolutePosition();

        const barycenter = Vector3.Zero(); //object.parent.getTransform().getAbsolutePosition();
        let sumOfMasses = 0;
        for (const parent of parents) {
            const mass = parent.model.physics.mass;
            barycenter.addInPlace(parent.getTransform().getAbsolutePosition().scale(mass));
            sumOfMasses += mass;
        }
        barycenter.scaleInPlace(1 / sumOfMasses);

        return getPointOnOrbit(barycenter, orbit, elapsedSeconds);
    }

    /**
     * Sets the position of the object on its orbit given the elapsed seconds.
     * @param object The object we want to update the position of
     * @param parents
     * @param elapsedSeconds The time elapsed since the beginning of time in seconds
     * @constructor
     */
    static SetOrbitalPosition(object: OrbitalObject, parents: OrbitalObject[], elapsedSeconds: number): void {
        const orbit = object.model.orbit;
        if (orbit.period === 0 || parents.length === 0) return;

        const oldPosition = object.getTransform().getAbsolutePosition();
        const newPosition = OrbitalObjectUtils.GetOrbitalPosition(object, parents, elapsedSeconds);
        translate(object.getTransform(), newPosition.subtractInPlace(oldPosition));
    }

    /**
     * Computes the rotation to apply in the current frame to the object around its axis. This does not update the rotation of the object (see UpdateRotation)
     * @param object The object we want to compute the rotation of
     * @param deltaTime The time elapsed since the last update
     * @constructor
     */
    static GetRotationAngle(object: OrbitalObject, deltaTime: number): number {
        if (object.model.physics.rotationPeriod === 0) return 0;
        return (2 * Math.PI * deltaTime) / object.model.physics.rotationPeriod;
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
export type OrbitalObjectModel = {
    /**
     * The name of the object
     */
    readonly name: string;

    /**
     * The seed used by the random number generator
     */
    readonly seed: number;

    /**
     * The type of the celestial body
     */
    readonly type: OrbitalObjectType;

    /**
     * Orbit properties of the object
     */
    readonly orbit: Orbit;

    /**
     * Physical properties of the object
     */
    readonly physics: OrbitalObjectPhysicsInfo;
};

export const enum OrbitalObjectType {
    STAR = 0,
    NEUTRON_STAR = 1,
    BLACK_HOLE = 2,
    TELLURIC_PLANET = 1000,
    TELLURIC_SATELLITE = 1001,
    GAS_PLANET = 1002,
    MANDELBULB = 2000,
    JULIA_SET = 2001,
    SPACE_STATION = 3000,
    SPACE_ELEVATOR = 3001
}

export const SatelliteTypes = [OrbitalObjectType.TELLURIC_SATELLITE, OrbitalObjectType.SPACE_STATION];

export function isSatellite(orbitalObjectType: OrbitalObjectType): boolean {
    return SatelliteTypes.includes(orbitalObjectType);
}
