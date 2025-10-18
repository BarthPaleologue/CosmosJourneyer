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

import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsConstraintAxis } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { type Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import { type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";

import { clamp } from "@/utils/math";

import type { Transformable } from "../universe/architecture/transformable";

export type SteeringMode = "counterPhase" | "inPhase";

export class Vehicle implements Transformable {
    readonly frame: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape };

    readonly motorConstraints: ReadonlyArray<Physics6DoFConstraint>;
    readonly steeringConstraints: ReadonlyArray<{ position: "rear" | "front"; constraint: Physics6DoFConstraint }>;

    private steeringMode: SteeringMode = "counterPhase";

    private targetSpeed = 0;
    private targetSteeringAngle = 0;

    readonly maxForwardSpeed = 50;
    readonly maxReverseSpeed = 25;
    readonly maxSteeringAngle = Math.PI / 6;

    constructor(
        frame: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape },
        motorConstraints: ReadonlyArray<Physics6DoFConstraint>,
        steeringConstraints: ReadonlyArray<{ position: "rear" | "front"; constraint: Physics6DoFConstraint }>,
    ) {
        this.frame = frame;
        this.motorConstraints = [...motorConstraints];
        this.steeringConstraints = [...steeringConstraints];
    }

    getSteeringMode() {
        return this.steeringMode;
    }

    setSteeringMode(mode: SteeringMode) {
        this.steeringMode = mode;
    }

    setTargetSteeringAngle(angle: number) {
        this.targetSteeringAngle = clamp(angle, -this.maxSteeringAngle, this.maxSteeringAngle);
        for (const { constraint, position } of this.steeringConstraints) {
            const wheelAngle =
                position === "front"
                    ? angle
                    : this.getSteeringMode() === "counterPhase"
                      ? -this.targetSteeringAngle
                      : this.targetSteeringAngle;
            constraint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_Y, 60000000);
            constraint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, wheelAngle);
        }
    }

    setTargetSpeed(speed: number) {
        this.targetSpeed = clamp(speed, -this.maxReverseSpeed, this.maxForwardSpeed);
        const motorTorque = 330000 / 20;
        for (const motor of this.motorConstraints) {
            motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, motorTorque);
            motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, this.targetSpeed);
        }
    }

    accelerate(deltaSpeed: number) {
        this.setTargetSpeed(this.targetSpeed + deltaSpeed);
        this.targetSpeed *= 0.98;
    }

    brake() {
        const brakeTorque = 1e6;
        for (const motor of this.motorConstraints) {
            motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, brakeTorque);
            motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, 0);
        }

        this.targetSpeed = 0;
    }

    turn(angle: number) {
        this.setTargetSteeringAngle(this.targetSteeringAngle + angle);
        this.targetSteeringAngle *= 0.95;
    }

    getTransform(): TransformNode {
        return this.frame.mesh;
    }
}
