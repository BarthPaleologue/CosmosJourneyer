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
import { type Vehicle } from "./vehicle";
import { VehicleInputs } from "./vehicleControlsInputs";

export class VehicleControls implements Controls {
    private vehicle: Vehicle | null = null;

    private readonly thirdPersonTransform: TransformNode;

    private readonly thirdPersonCameraYOffset = 2;

    private readonly thirdPersonCamera: ArcRotateCamera;

    private readonly firstPersonCamera: FreeCamera;

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

    setVehicle(vehicle: Vehicle) {
        this.vehicle = vehicle;
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
        const vehicleLinearVelocityFlat = vehicleLinearVelocity
            .subtract(
                this.thirdPersonTransform.up.scale(Vector3.Dot(vehicleLinearVelocity, this.thirdPersonTransform.up)),
            )
            .negate();
        const vehicleForward =
            vehicleLinearVelocityFlat.length() > 3
                ? vehicleLinearVelocityFlat.normalizeToNew()
                : vehicle.getTransform().forward;
        const vehicleForwardFlat = vehicleForward
            .subtract(this.thirdPersonTransform.up.scale(Vector3.Dot(vehicleForward, this.thirdPersonTransform.up)))
            .normalize();
        const thirdPersonForward = Vector3.Normalize(this.thirdPersonTransform.forward);
        const clampedDot = Math.min(Math.max(Vector3.Dot(vehicleForwardFlat, thirdPersonForward), -1), 1);
        const cross = Vector3.Cross(thirdPersonForward, vehicleForwardFlat);
        const signedAngle = Math.atan2(Vector3.Dot(cross, this.thirdPersonTransform.up), clampedDot);

        const rotationHalfLife = 0.5;
        const rotationT = lerpSmooth(0, 1, rotationHalfLife, deltaSeconds);

        const rotation = Quaternion.RotationAxis(this.thirdPersonTransform.up, signedAngle * rotationT);
        this.thirdPersonTransform.rotationQuaternion = rotation.multiply(
            this.thirdPersonTransform.rotationQuaternion ?? Quaternion.Identity(),
        );

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
