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
import { degreesToRadians, EarthG, kmhToMetersPerSecond } from "@cosmos-journeyer/physics";

import { clamp, lerp, lerpSmooth } from "@/utils/math";

import { getBoundingRadius } from "../helpers/boundingRadius";
import type { Door } from "./door";
import { deriveSteeringGeometry, getWheelSteeringAngle, computeSpeedLimitedCurvature } from "./steeringGeometry";
import type { SteeringGeometry } from "./steeringGeometry";
import type { Wheel } from "./wheel";

const SteeringMotorMaxForce = 10_000;

export type SteeringMode = "counterPhase" | "inPhase";

export type VehicleOptions = {
    /** Initial tuning budget in m/s², independent of the local gravity system. */
    readonly maxLateralAcceleration: number;
    /** Explicit turning reference for layouts with incompatible fixed axles. */
    readonly steeringReferenceZ: number;
};

export type VehicleSteeringOptions = {
    /** Ground-plane speed in m/s; omit to use the magnitude of the 3D velocity. */
    readonly horizontalSpeed: number;
};

export type FixedVehiclePart = {
    readonly aggregate: PhysicsAggregate;
    readonly constraint: Physics6DoFConstraint;
    readonly mesh: AbstractMesh;
};

export class Vehicle {
    readonly name: string;

    readonly frame: PhysicsAggregate;

    readonly doors: ReadonlyArray<Door>;

    readonly wheels: ReadonlyArray<Wheel>;

    private readonly fixedParts: ReadonlyArray<FixedVehiclePart>;

    private steeringMode: SteeringMode = "counterPhase";

    readonly steeringGeometry: SteeringGeometry | undefined;
    readonly maxLateralAcceleration: number;

    private targetLongitudinalSpeed = 0;
    private steeringCommandAngle = 0;

    readonly maxSpeed = {
        forward: kmhToMetersPerSecond(40),
        forwardBoost: kmhToMetersPerSecond(80),
        reverse: kmhToMetersPerSecond(20),
    } as const;

    readonly mechanicalSteeringAngleLimit = degreesToRadians(45);
    readonly legacyHighSpeedSteeringAngleLimit = degreesToRadians(7);

    private boostEnabled = false;

    readonly allMeshes: ReadonlyArray<AbstractMesh>;

    private readonly boundingRadius: number;

    constructor(
        name: string,
        frame: PhysicsAggregate,
        doors: ReadonlyArray<Door>,
        wheels: ReadonlyArray<Wheel>,
        fixedParts: ReadonlyArray<FixedVehiclePart>,
        allMeshes: ReadonlyArray<AbstractMesh>,
        options?: Partial<VehicleOptions>,
    ) {
        this.name = name;
        this.frame = frame;
        this.doors = [...doors];
        this.wheels = [...wheels];
        this.fixedParts = [...fixedParts];
        this.allMeshes = [...allMeshes];

        this.maxLateralAcceleration = options?.maxLateralAcceleration ?? 0.5 * EarthG;
        const wheelGeometry = this.wheels.map((wheel) => ({
            position: wheel.frameLocalPosition,
            steerable: wheel.steering !== null,
        }));
        this.steeringGeometry = deriveSteeringGeometry(wheelGeometry, {
            steeringReferenceZOverride: options?.steeringReferenceZ,
        });
        if (
            import.meta.env.DEV &&
            this.steeringGeometry === undefined &&
            this.wheels.some((wheel) => wheel.steering !== null)
        ) {
            console.warn(
                `Vehicle "${name}" has no usable steering reference; using legacy steering. Multiple fixed axles require an explicit steeringReferenceZ approximation.`,
            );
        }

        this.boundingRadius = getBoundingRadius(this.getTransform());
    }

    getSteeringMode(): SteeringMode {
        return this.steeringMode;
    }

    setSteeringMode(mode: SteeringMode): void {
        if (mode === this.steeringMode) {
            return;
        }
        this.steeringMode = mode;
        // A command in one mode cannot be carried into a different wheel motion.
        this.setTargetSteeringAngle(0);
    }

    /** Pass ground-plane speed when available; other callers retain the 3D speed fallback. */
    setTargetSteeringAngle(requestedSteeringAngle: number, options?: Partial<VehicleSteeringOptions>): void {
        const speed = Math.abs(options?.horizontalSpeed ?? this.frame.body.getLinearVelocity().length());
        const geometry = this.steeringMode === "counterPhase" ? this.steeringGeometry : undefined;
        let curvature = 0;
        if (geometry !== undefined) {
            curvature = computeSpeedLimitedCurvature(
                requestedSteeringAngle,
                geometry.referenceLeverArm,
                speed,
                this.maxLateralAcceleration,
                this.mechanicalSteeringAngleLimit,
            );
            // Store the applied virtual angle so keyboard integration cannot wind up.
            this.steeringCommandAngle = Math.atan(curvature * geometry.referenceLeverArm);
        } else {
            const maxSteeringAngle = lerp(
                this.legacyHighSpeedSteeringAngleLimit,
                this.mechanicalSteeringAngleLimit,
                2 ** (-speed / kmhToMetersPerSecond(10)),
            );
            this.steeringCommandAngle = clamp(requestedSteeringAngle, -maxSteeringAngle, maxSteeringAngle);
        }
        for (const wheel of this.wheels) {
            const steering = wheel.steering;
            if (steering === null) {
                continue;
            }

            const wheelSteeringAngle =
                geometry !== undefined
                    ? getWheelSteeringAngle(
                          curvature,
                          wheel.frameLocalPosition.z - geometry.steeringReferenceZ,
                          this.mechanicalSteeringAngleLimit,
                      )
                    : this.steeringCommandAngle *
                      (this.steeringMode === "counterPhase" && steering.position === "rear" ? -1 : 1);
            steering.constraint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_Y, SteeringMotorMaxForce);
            steering.constraint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, wheelSteeringAngle);
        }
    }

    setTargetSpeed(speed: number): void {
        const speedUpperBound = this.boostEnabled ? this.maxSpeed.forwardBoost : this.maxSpeed.forward;
        this.targetLongitudinalSpeed = clamp(speed, -this.maxSpeed.reverse, speedUpperBound);
        const motorTorque = this.boostEnabled ? 15_000 : 5_000;
        for (const wheel of this.wheels) {
            if (wheel.motor === null) {
                continue;
            }

            const targetAngularVelocity = this.targetLongitudinalSpeed / wheel.radius;

            wheel.motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, motorTorque);
            wheel.motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, targetAngularVelocity);
        }
    }

    accelerate(acceleration: number, deltaSeconds: number): void {
        this.setTargetSpeed(this.targetLongitudinalSpeed + acceleration * deltaSeconds);
        this.targetLongitudinalSpeed = lerpSmooth(this.targetLongitudinalSpeed, 0, 2.5, deltaSeconds);
    }

    brake(): void {
        const brakeTorque = 20_000;
        for (const wheel of this.wheels) {
            if (wheel.motor === null) {
                continue;
            }

            wheel.motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, brakeTorque);
            wheel.motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, 0);
        }

        this.targetLongitudinalSpeed = 0;
    }

    turn(steeringRate: number, deltaSeconds: number, options?: Partial<VehicleSteeringOptions>): void {
        this.setTargetSteeringAngle(this.steeringCommandAngle + steeringRate * deltaSeconds, options);
        this.steeringCommandAngle = lerpSmooth(this.steeringCommandAngle, 0, 0.225, deltaSeconds);
    }

    setBoostEnabled(enabled: boolean): void {
        this.boostEnabled = enabled;
    }

    getTransform(): TransformNode {
        return this.frame.transformNode;
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getFrameAggregate(): PhysicsAggregate {
        return this.frame;
    }

    dispose(): void {
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
