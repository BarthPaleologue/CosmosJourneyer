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

import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsConstraintAxis } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import { degreesToRadians, kmhToMetersPerSecond } from "@cosmos-journeyer/physics";

import { clamp, lerp, lerpSmooth } from "@/utils/math";

import i18n from "@/i18n";

import { ObjectTargetCursorType, type Targetable, type TargetInfo } from "../universe/architecture/targetable";
import type { Door } from "./door";
import type { Wheel } from "./wheel";

const SteeringMotorMaxForce = 10_000;

export type SteeringMode = "counterPhase" | "inPhase";

export type FixedVehiclePart = {
    readonly aggregate: PhysicsAggregate;
    readonly constraint: Physics6DoFConstraint;
    readonly mesh: AbstractMesh;
};

export class Vehicle implements Targetable {
    readonly frame: PhysicsAggregate;

    readonly doors: ReadonlyArray<Door>;

    readonly wheels: ReadonlyArray<Wheel>;

    private readonly fixedParts: ReadonlyArray<FixedVehiclePart>;

    private steeringMode: SteeringMode = "counterPhase";

    private targetSpeed = 0;
    private targetSteeringAngle = 0;

    readonly maxSpeed = {
        forward: kmhToMetersPerSecond(40),
        forwardBoost: kmhToMetersPerSecond(80),
        reverse: kmhToMetersPerSecond(20),
    } as const;

    readonly maxSteeringAngle = {
        lowSpeed: degreesToRadians(45),
        highSpeed: degreesToRadians(7),
    } as const;

    private boostEnabled = false;

    readonly allMeshes: ReadonlyArray<AbstractMesh>;

    readonly targetInfo: TargetInfo;

    private readonly boundingRadius: number;

    constructor(
        name: string,
        frame: PhysicsAggregate,
        doors: ReadonlyArray<Door>,
        wheels: ReadonlyArray<Wheel>,
        fixedParts: ReadonlyArray<FixedVehiclePart>,
        allMeshes: ReadonlyArray<AbstractMesh>,
    ) {
        this.frame = frame;
        this.doors = [...doors];
        this.wheels = [...wheels];
        this.fixedParts = [...fixedParts];
        this.allMeshes = [...allMeshes];

        const { min: boundingMin, max: boundingMax } = this.getTransform().getHierarchyBoundingVectors();
        this.boundingRadius = boundingMax.subtract(boundingMin).length() / 2;

        this.targetInfo = {
            name,
            type: ObjectTargetCursorType.VEHICLE,
            minDistance: this.boundingRadius * 10,
            maxDistance: 0,
        };
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
            this.maxSteeringAngle.highSpeed,
            this.maxSteeringAngle.lowSpeed,
            2 ** (-linearVelocity / kmhToMetersPerSecond(10)),
        );
        this.targetSteeringAngle = clamp(angle, -maxSteeringAngle, maxSteeringAngle);
        for (const wheel of this.wheels) {
            const steering = wheel.steering;
            if (steering === null) {
                continue;
            }

            const wheelAngle =
                steering.position === "front"
                    ? this.targetSteeringAngle
                    : this.getSteeringMode() === "counterPhase"
                      ? -this.targetSteeringAngle
                      : this.targetSteeringAngle;
            steering.constraint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_Y, SteeringMotorMaxForce);
            steering.constraint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, wheelAngle);
        }
    }

    setTargetSpeed(speed: number) {
        const speedUpperBound = this.boostEnabled ? this.maxSpeed.forwardBoost : this.maxSpeed.forward;
        this.targetSpeed = clamp(speed, -this.maxSpeed.reverse, speedUpperBound);
        const motorTorque = this.boostEnabled ? 15_000 : 5_000;
        for (const wheel of this.wheels) {
            if (wheel.motor === null) {
                continue;
            }

            const targetAngularVelocity = this.targetSpeed / wheel.radius;

            wheel.motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, motorTorque);
            wheel.motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, targetAngularVelocity);
        }
    }

    accelerate(acceleration: number, deltaSeconds: number) {
        this.setTargetSpeed(this.targetSpeed + acceleration * deltaSeconds);
        this.targetSpeed = lerpSmooth(this.targetSpeed, 0, 2.5, deltaSeconds);
    }

    brake() {
        const brakeTorque = 20_000;
        for (const wheel of this.wheels) {
            if (wheel.motor === null) {
                continue;
            }

            wheel.motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, brakeTorque);
            wheel.motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, 0);
        }

        this.targetSpeed = 0;
    }

    turn(steeringSpeed: number, deltaSeconds: number) {
        this.setTargetSteeringAngle(this.targetSteeringAngle + steeringSpeed * deltaSeconds);
        this.targetSteeringAngle = lerpSmooth(this.targetSteeringAngle, 0, 0.225, deltaSeconds);
    }

    setBoostEnabled(enabled: boolean) {
        this.boostEnabled = enabled;
    }

    getTransform(): TransformNode {
        return this.frame.transformNode;
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:vehicle");
    }

    getFrameAggregate() {
        return this.frame;
    }

    dispose() {
        for (const door of this.doors) {
            door.dispose();
        }

        for (const wheel of this.wheels) {
            wheel.dispose();
        }

        for (const fixedPart of this.fixedParts) {
            fixedPart.constraint.dispose();
            fixedPart.aggregate.dispose();
            fixedPart.mesh.dispose();
        }

        this.frame.dispose();
        this.frame.transformNode.dispose();
    }
}
