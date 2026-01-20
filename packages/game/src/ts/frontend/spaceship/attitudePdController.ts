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

import { Vector3, type Quaternion } from "@babylonjs/core/Maths/math.vector";
import type { PhysicsMassProperties } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

export type AngularMassProperties = Required<Omit<PhysicsMassProperties, "centerOfMass">>;

export class AttitudePDController {
    /**
     * Proportional gain (stiffness).
     */
    readonly kp: number;

    /**
     * Derivative gain (damping).
     */
    readonly kd: number;

    constructor(kp: number, kd: number) {
        this.kp = kp;
        this.kd = kd;
    }

    /**
     * Returns world-space torque to apply this step.
     */
    computeTorqueToRef(
        current: { orientation: Quaternion; angularVelocity: Vector3 },
        target: { orientation: Quaternion; angularVelocity: Vector3 },
        massProps: AngularMassProperties,
        ref: Vector3,
    ): Vector3 {
        const quaternionError = target.orientation.multiply(current.orientation.conjugate());
        if (quaternionError.w < 0) {
            quaternionError.scaleInPlace(-1); // shortest arc
        }

        // convert the quaternion error to a scale-axis representation
        let rotationError = Vector3.Zero();
        const v = new Vector3(quaternionError.x, quaternionError.y, quaternionError.z);
        const vLen = v.length();
        if (vLen > 1e-8) {
            const angle = 2 * Math.atan2(vLen, quaternionError.w);
            const axis = v.scale(1 / vLen);
            rotationError = axis.scale(angle);
        }

        const angularVelocityError = current.angularVelocity.subtract(target.angularVelocity);

        const mass = massProps.mass;
        const inertiaPerMassUnit = massProps.inertia;
        const inertiaOrientation = massProps.inertiaOrientation;
        const inertia = inertiaPerMassUnit.scale(mass);

        const worldFromInertia = inertiaOrientation.multiply(current.orientation);
        const inertiaFromWorld = worldFromInertia.conjugate();

        const rotationErrorLocal = rotationError.applyRotationQuaternion(inertiaFromWorld);
        const angularVelocityErrorLocal = angularVelocityError.applyRotationQuaternion(inertiaFromWorld);

        const torqueLocal = rotationErrorLocal
            .multiply(inertia)
            .scale(this.kp)
            .add(angularVelocityErrorLocal.multiply(inertia).scale(-this.kd));

        const torque = torqueLocal.applyRotationQuaternionToRef(worldFromInertia, ref);

        return torque;
    }
}
