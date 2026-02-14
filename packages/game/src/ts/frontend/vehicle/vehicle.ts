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

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsConstraintAxis } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { clamp } from "@/utils/math";
import { degreesToRadians, kmhToMetersPerSecond } from "@/utils/physics/unitConversions";

import { lerp } from "../helpers/animations/interpolations";
import type { Transformable } from "../universe/architecture/transformable";
import type { Door } from "./door";
import type { Wheel } from "./wheel";

export type SteeringMode = "counterPhase" | "inPhase";

export class Vehicle implements Transformable {
    readonly frame: PhysicsAggregate;

    readonly doors: ReadonlyArray<Door>;

    readonly wheels: ReadonlyArray<Wheel>;

    private steeringMode: SteeringMode = "counterPhase";

    private targetSpeed = 0;
    private targetSteeringAngle = 0;

    readonly maxForwardSpeed = kmhToMetersPerSecond(100);
    readonly maxReverseSpeed = kmhToMetersPerSecond(70);
    readonly maxSteeringAngleLowSpeed = degreesToRadians(45);
    readonly maxSteeringAngleHighSpeed = degreesToRadians(3);

    constructor(frame: PhysicsAggregate, doors: ReadonlyArray<Door>, wheels: ReadonlyArray<Wheel>) {
        this.frame = frame;
        this.doors = [...doors];
        this.wheels = [...wheels];
    }

    getSteeringMode() {
        return this.steeringMode;
    }

    setSteeringMode(mode: SteeringMode) {
        this.steeringMode = mode;
    }

    setTargetSteeringAngle(angle: number) {
        const linearVelocity = this.frame.body.getLinearVelocity().length();
        const maxSteeringAngle = lerp(
            this.maxSteeringAngleHighSpeed,
            this.maxSteeringAngleLowSpeed,
            2 ** (-linearVelocity / kmhToMetersPerSecond(20)),
        );
        this.targetSteeringAngle = clamp(angle, -maxSteeringAngle, maxSteeringAngle);
        for (const wheel of this.wheels) {
            const steering = wheel.steering;
            if (steering === undefined) {
                continue;
            }

            const wheelAngle =
                steering.position === "front"
                    ? this.targetSteeringAngle
                    : this.getSteeringMode() === "counterPhase"
                      ? -this.targetSteeringAngle
                      : this.targetSteeringAngle;
            steering.constraint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_Y, 60_000_000);
            steering.constraint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, wheelAngle);
        }
    }

    setTargetSpeed(speed: number) {
        this.targetSpeed = clamp(speed, -this.maxReverseSpeed, this.maxForwardSpeed);
        const motorTorque = 330000 / 50;
        for (const { radius, motor } of this.wheels) {
            if (motor === undefined) {
                continue;
            }

            const targetAngularVelocity = this.targetSpeed / radius;

            motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, motorTorque);
            motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, targetAngularVelocity);
        }
    }

    accelerate(deltaSpeed: number) {
        this.setTargetSpeed(this.targetSpeed + deltaSpeed);
        this.targetSpeed *= 0.98;
    }

    brake() {
        const brakeTorque = 1e6;
        for (const { motor } of this.wheels) {
            if (motor === undefined) {
                continue;
            }

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
        return this.frame.transformNode;
    }

    dispose() {
        for (const door of this.doors) {
            door.dispose();
        }

        for (const wheel of this.wheels) {
            wheel.motor?.dispose();
            wheel.steering?.constraint.dispose();
            wheel.body.dispose();
            wheel.body.transformNode.dispose();
            wheel.shape.dispose();
        }

        this.frame.dispose();
    }
}
