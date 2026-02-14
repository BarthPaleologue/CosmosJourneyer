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
import { toggleDoor } from "./door";
import { type Vehicle } from "./vehicle";
import { VehicleInputs } from "./vehicleControlsInputs";

export class VehicleControls implements Controls {
    private vehicle: Vehicle | null = null;

    private readonly thirdPersonTransform: TransformNode;
    private readonly thirdPersonCameraYOffset = 2;

    readonly thirdPersonCamera: ArcRotateCamera;

    readonly firstPersonCamera: FreeCamera;

    private activeCamera: Camera;

    constructor(scene: Scene) {
        this.thirdPersonTransform = new TransformNode("thirdPersonTransform", scene);
        this.thirdPersonCamera = new ArcRotateCamera(
            "thirdPersonCamera",
            Math.PI / 2,
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

        const vehicleTransform = vehicle.getTransform();
        this.thirdPersonTransform.position.copyFrom(
            vehicleTransform
                .getAbsolutePosition()
                .add(this.thirdPersonTransform.up.scale(this.thirdPersonCameraYOffset)),
        );
        this.thirdPersonTransform.rotationQuaternion = Quaternion.FromLookDirectionRH(
            vehicleTransform.forward,
            this.thirdPersonTransform.up,
        );

        this.firstPersonCamera.parent = vehicleTransform;
    }

    setUpDirection(up: Vector3) {
        this.thirdPersonTransform.rotationQuaternion = Quaternion.FromLookDirectionRHToRef(
            this.thirdPersonTransform.forward,
            up,
            this.thirdPersonTransform.rotationQuaternion ?? Quaternion.Identity(),
        );
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

        const velocity = vehicle.getFrameAggregate().body.getLinearVelocity();
        const verticalVelocity = this.thirdPersonTransform.up.scale(
            Vector3.Dot(velocity, this.thirdPersonTransform.up),
        );
        const horizontalVelocity = velocity.subtract(verticalVelocity);
        const horizontalSpeed = horizontalVelocity.length();
        const horizontalDirection = horizontalVelocity.normalizeToNew();

        const deltaRotation = Quaternion.FromUnitVectorsToRef(
            this.thirdPersonTransform.forward,
            horizontalDirection,
            Quaternion.Identity(),
        );
        const targetRotation = deltaRotation.multiply(
            this.thirdPersonTransform.rotationQuaternion ?? Quaternion.Identity(),
        );
        const rotationHalfLife = 0.5;
        const rotationT = lerpSmooth(0, 1, rotationHalfLife, deltaSeconds) * Math.min(horizontalSpeed / 20, 1) ** 2;
        this.thirdPersonTransform.rotationQuaternion = Quaternion.Slerp(
            this.thirdPersonTransform.rotationQuaternion ?? Quaternion.Identity(),
            targetRotation,
            rotationT,
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
