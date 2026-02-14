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

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { Controls } from "../controls";
import { lerpSmooth } from "../helpers/animations/interpolations";
import { setUpVector } from "../helpers/transform";
import { toggleDoor } from "./door";
import { type Vehicle } from "./vehicle";
import { VehicleInputs } from "./vehicleControlsInputs";

export class VehicleControls implements Controls {
    private vehicle: Vehicle | null = null;

    private readonly thirdPersonTransform: TransformNode;
    private readonly smoothedMotionDirection = Vector3.Zero();

    private readonly thirdPersonCameraYOffset = 2;

    readonly thirdPersonCamera: ArcRotateCamera;

    readonly firstPersonCamera: FreeCamera;

    private activeCamera: Camera;

    constructor(scene: Scene) {
        this.thirdPersonTransform = new TransformNode("thirdPersonTransform", scene);
        this.thirdPersonCamera = new ArcRotateCamera(
            "thirdPersonCamera",
            -Math.PI / 3,
            Math.PI / 3,
            20,
            Vector3.Zero(),
            scene,
        );
        this.thirdPersonCamera.lowerRadiusLimit = 5;
        this.thirdPersonCamera.parent = this.thirdPersonTransform;

        this.firstPersonCamera = new FreeCamera("firstPersonCamera", new Vector3(0.5, 1, 2), scene);
        this.firstPersonCamera.speed = 0;

        this.activeCamera = this.firstPersonCamera;

        VehicleInputs.map.toggleCamera.on("complete", () => {
            if (this.activeCamera === this.firstPersonCamera) {
                this.switchToThirdPersonCamera();
            } else {
                this.switchToFirstPersonCamera();
            }
        });

        VehicleInputs.map.toggleDoors.on("complete", () => {
            if (this.vehicle === null) {
                return;
            }

            for (const door of this.vehicle.doors) {
                toggleDoor(door);
            }
        });
    }

    shouldLockPointer(): boolean {
        return true;
    }

    getCameras(): Array<Camera> {
        return [this.thirdPersonCamera, this.firstPersonCamera];
    }

    getActiveCamera(): Camera {
        return this.activeCamera;
    }

    switchToFirstPersonCamera() {
        this.activeCamera = this.firstPersonCamera;
    }

    switchToThirdPersonCamera() {
        this.activeCamera = this.thirdPersonCamera;
    }

    setVehicle(vehicle: Vehicle | null) {
        this.vehicle = vehicle;
        if (vehicle === null) {
            return;
        }

        this.thirdPersonTransform.position.copyFrom(
            vehicle
                .getTransform()
                .getAbsolutePosition()
                .add(this.thirdPersonTransform.up.scale(this.thirdPersonCameraYOffset)),
        );
        this.firstPersonCamera.parent = vehicle.getTransform();
    }

    setUpDirection(up: Vector3) {
        setUpVector(this.thirdPersonTransform, up);
    }

    getVehicle() {
        return this.vehicle;
    }

    getTransform(): TransformNode {
        const vehicle = this.getVehicle();
        if (vehicle === null) {
            throw new Error("No vehicle assigned to controls");
        }

        return vehicle.getTransform();
    }

    update(deltaSeconds: number): void {
        const vehicle = this.getVehicle();
        if (vehicle === null) {
            return;
        }

        const thirdPersonCameraTarget = this.thirdPersonTransform.position;
        const vehiclePosition = vehicle.getTransform().getAbsolutePosition();
        const targetPosition = vehiclePosition.add(this.thirdPersonTransform.up.scale(this.thirdPersonCameraYOffset));

        const translationHalfLife = 0.2;

        const translationT = lerpSmooth(0, 1, translationHalfLife, deltaSeconds);
        this.thirdPersonTransform.position.copyFrom(
            Vector3.Lerp(thirdPersonCameraTarget, targetPosition, translationT),
        );

        const vehicleLinearVelocity = vehicle.getTransform().physicsBody?.getLinearVelocity() ?? Vector3.Zero();
        const vehicleLinearVelocityFlat = vehicleLinearVelocity.subtract(
            this.thirdPersonTransform.up.scale(Vector3.Dot(vehicleLinearVelocity, this.thirdPersonTransform.up)),
        );
        const vehicleFlatSpeed = vehicleLinearVelocityFlat.length();
        const vehicleForwardFlat = vehicle
            .getTransform()
            .forward.subtract(
                this.thirdPersonTransform.up.scale(
                    Vector3.Dot(vehicle.getTransform().forward, this.thirdPersonTransform.up),
                ),
            );

        if (this.smoothedMotionDirection.lengthSquared() < 1e-6) {
            this.smoothedMotionDirection.copyFrom(vehicleForwardFlat.normalizeToNew());
        }

        const targetMotionDirection =
            vehicleFlatSpeed > 0.2 ? vehicleLinearVelocityFlat.normalizeToNew() : this.smoothedMotionDirection;

        const directionHalfLife = 0.2;
        const directionT = lerpSmooth(0, 1, directionHalfLife, deltaSeconds);
        this.smoothedMotionDirection.copyFrom(
            Vector3.Lerp(this.smoothedMotionDirection, targetMotionDirection, directionT).normalize(),
        );

        const rotationHalfLife = 0.5;
        const baseRotationT = lerpSmooth(0, 1, rotationHalfLife, deltaSeconds);
        const rotationBlendFullSpeed = 1;
        const speedBlend = Math.min(vehicleFlatSpeed / rotationBlendFullSpeed, 1);
        const rotationBlend = speedBlend * speedBlend;
        const rotationT = baseRotationT * rotationBlend;
        const currentRotation = this.thirdPersonTransform.rotationQuaternion ?? Quaternion.Identity();
        const currentForwardFlat = this.thirdPersonTransform.forward
            .subtract(
                this.thirdPersonTransform.up.scale(
                    Vector3.Dot(this.thirdPersonTransform.forward, this.thirdPersonTransform.up),
                ),
            )
            .normalize();
        const desiredForward = this.smoothedMotionDirection.negate();
        const clampedDot = Math.min(Math.max(Vector3.Dot(currentForwardFlat, desiredForward), -1), 1);
        const cross = Vector3.Cross(currentForwardFlat, desiredForward);
        const crossUpDot = Vector3.Dot(cross, this.thirdPersonTransform.up);
        const signedAngle = Math.atan2(crossUpDot, clampedDot);
        const targetRotation = Quaternion.RotationAxis(this.thirdPersonTransform.up, signedAngle).multiply(
            currentRotation,
        );
        this.thirdPersonTransform.rotationQuaternion = Quaternion.Slerp(currentRotation, targetRotation, rotationT);

        const steeringAngle = VehicleInputs.map.steer.value * 0.03;
        vehicle.turn(steeringAngle);

        if (VehicleInputs.map.brake.value > 0) {
            vehicle.brake();
        } else {
            const vehicleMaxAcceleration = 8;
            const vehicleAcceleration = VehicleInputs.map.accelerate.value * vehicleMaxAcceleration;
            vehicle.accelerate(vehicleAcceleration);
        }

        return;
    }
}
