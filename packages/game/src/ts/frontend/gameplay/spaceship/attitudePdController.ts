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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
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

    private readonly tmpQuaternionError = new Quaternion();
    private readonly tmpScaledAxisError = new Vector3();
    private readonly tmpAngularVelocityError = new Vector3();
    private readonly tmpInertia = new Vector3();
    private readonly tmpWorldFromInertia = new Quaternion();
    private readonly tmpInertiaFromWorld = new Quaternion();
    private readonly tmpRotationErrorLocal = new Vector3();
    private readonly tmpAngularVelocityErrorLocal = new Vector3();
    private readonly tmpProportionalTerm = new Vector3();
    private readonly tmpDerivativeTerm = new Vector3();

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
        const quaternionError = target.orientation.multiplyToRef(
            current.orientation.conjugateToRef(this.tmpQuaternionError),
            this.tmpQuaternionError,
        );
        if (quaternionError.w < 0) {
            quaternionError.scaleInPlace(-1); // shortest arc
        }

        // convert the quaternion error to a scale-axis representation
        const scaledAxisError = this.tmpScaledAxisError;
        const angle = quaternionError.toAxisAngleToRef(scaledAxisError);
        scaledAxisError.scaleInPlace(angle);

        const angularVelocityError = target.angularVelocity.subtractToRef(
            current.angularVelocity,
            this.tmpAngularVelocityError,
        );

        const mass = massProps.mass;
        const inertiaPerMassUnit = massProps.inertia;
        const inertiaOrientation = massProps.inertiaOrientation;
        const inertia = inertiaPerMassUnit.scaleToRef(mass, this.tmpInertia);

        const worldFromInertia = inertiaOrientation.multiplyToRef(current.orientation, this.tmpWorldFromInertia);
        const inertiaFromWorld = worldFromInertia.conjugateToRef(this.tmpInertiaFromWorld);

        const rotationErrorLocal = scaledAxisError.rotateByQuaternionToRef(
            inertiaFromWorld,
            this.tmpRotationErrorLocal,
        );
        const angularVelocityErrorLocal = angularVelocityError.rotateByQuaternionToRef(
            inertiaFromWorld,
            this.tmpAngularVelocityErrorLocal,
        );

        const torqueLocal = rotationErrorLocal
            .multiplyToRef(inertia, this.tmpProportionalTerm)
            .scaleInPlace(this.kp)
            .addInPlace(angularVelocityErrorLocal.multiplyToRef(inertia, this.tmpDerivativeTerm).scaleInPlace(this.kd));

        const torque = torqueLocal.applyRotationQuaternionToRef(worldFromInertia, ref);

        return torque;
    }
}
