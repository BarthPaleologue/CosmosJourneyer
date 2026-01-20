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
     * @param current
     * @param target
     * @param mass
     * @returns A world-space force to apply this step.
     */
    computeForceToRef(
        current: { position: Vector3; velocity: Vector3 },
        target: { position: Vector3; velocity: Vector3 },
        mass: number,
        ref: Vector3,
    ): Vector3 {
        const positionError = target.position.subtractToRef(current.position, this.tmpPositionError);
        const velocityError = target.velocity.subtractToRef(current.velocity, this.tmpVelocityError);

        return positionError.scaleToRef(this.kp * mass, ref).addInPlace(velocityError.scaleInPlace(this.kd * mass));
    }
}
