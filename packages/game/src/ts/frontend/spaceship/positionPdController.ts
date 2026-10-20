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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class PositionPDController {
    /**
     * Proportional gain (stiffness in 1/s^2).
     */
    readonly kp: number;

    /**
     * Derivative gain (damping in 1/s).
     */
    readonly kd: number;

    private readonly tmpPositionError = Vector3.Zero();
    private readonly tmpVelocityError = Vector3.Zero();
    private readonly tmpDirToTarget = Vector3.Zero();

    /**
     * Creates a new PositionPDController.
     * @param kp Proportional gain (stiffness in 1/s^2).
     * @param kd Derivative gain (damping in 1/s).
     */
    constructor(kp: number, kd: number) {
        this.kp = kp;
        this.kd = kd;
    }

    /**
     * Computes a force that steers the body toward a position and velocity.
     * @param current Current position and velocity state.
     * @param current.position Current world-space position.
     * @param current.velocity Current world-space velocity.
     * @param target Desired position and velocity state.
     * @param target.position Desired world-space position.
     * @param target.velocity Desired world-space velocity.
     * @param mass Mass of the controlled body.
     * @param ref Vector that receives the computed force.
     * @param options Optional limits on closing speed and acceleration.
     * @returns The computed world-space force in `ref`.
     */
    computeForceToRef(
        current: { position: Vector3; velocity: Vector3 },
        target: { position: Vector3; velocity: Vector3 },
        mass: number,
        ref: Vector3,
        options?: Partial<{ max?: { closingSpeed: number; acceleration: number } }>,
    ): Vector3 {
        const positionError = target.position.subtractToRef(current.position, this.tmpPositionError);
        const velocityError = target.velocity.subtractToRef(current.velocity, this.tmpVelocityError);

        if (options?.max !== undefined) {
            const distanceToTarget = positionError.length();
            if (distanceToTarget < 0.01) {
                // Close enough to target position: no position correction.
                return velocityError.scaleInPlace(this.kd * mass);
            }
            const dirToTarget = positionError.scaleToRef(1 / distanceToTarget, this.tmpDirToTarget);

            const desiredClosingSpeed = Math.min(
                options.max.closingSpeed,
                Math.sqrt(2 * options.max.acceleration * distanceToTarget),
            );

            velocityError.addInPlace(dirToTarget.scaleInPlace(desiredClosingSpeed));
        }

        return positionError.scaleToRef(this.kp * mass, ref).addInPlace(velocityError.scaleInPlace(this.kd * mass));
    }
}
