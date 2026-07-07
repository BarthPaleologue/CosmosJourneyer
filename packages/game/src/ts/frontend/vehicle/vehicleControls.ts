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
import { EarthG } from "@cosmos-journeyer/physics";

import { lerp, lerpAngle, lerpSmooth, smoothstep } from "@/utils/math";

import type { Controls } from "../controls";
import { CustomAnimation } from "../helpers/animations/customAnimation";
import { easeInOutCubic } from "../helpers/animations/interpolations";
import { toggleDoor } from "./door";
import {
    type ThirdPersonCameraPreset,
    type ThirdPersonCameraPresetNames,
    thirdPersonCameraPresets,
} from "./thirdPersonCameraPresets";
import { type Vehicle } from "./vehicle";
import { VehicleInputs } from "./vehicleControlsInputs";

type CameraPresetInput = (typeof VehicleInputs.map)["resetCamera"];

export class VehicleControls implements Controls {
    private vehicle: Vehicle | null = null;

    private readonly thirdPersonTransform: TransformNode;
    private readonly thirdPersonCameraYOffset = 2;

    readonly thirdPersonCamera: ArcRotateCamera;
    private thirdPersonCameraAnimation: CustomAnimation<ThirdPersonCameraPreset> | null = null;

    readonly firstPersonCamera: FreeCamera;

    private activeCamera: Camera;

    constructor(scene: Scene) {
        this.thirdPersonTransform = new TransformNode("thirdPersonTransform", scene);
        this.thirdPersonCamera = new ArcRotateCamera(
            "thirdPersonCamera",
            thirdPersonCameraPresets.behindCentered.alpha,
            thirdPersonCameraPresets.behindCentered.beta,
            thirdPersonCameraPresets.behindCentered.radius,
            thirdPersonCameraPresets.behindCentered.target.clone(),
            scene,
        );
        this.thirdPersonCamera.lowerRadiusLimit = 5;
        this.thirdPersonCamera.upperRadiusLimit = 100;
        this.thirdPersonCamera.parent = this.thirdPersonTransform;

        this.firstPersonCamera = new FreeCamera("firstPersonCamera", new Vector3(0.5, 1, 2), scene);
        this.firstPersonCamera.speed = 0;
        this.firstPersonCamera.minZ = 0.2;

        this.activeCamera = this.thirdPersonCamera;

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

        this.bindCameraPresetInput(VehicleInputs.map.resetCamera, "behindCentered");
        this.bindCameraPresetInput(VehicleInputs.map.switchToCameraPreset1, "behindLeft");
        this.bindCameraPresetInput(VehicleInputs.map.switchToCameraPreset2, "behindRight");
        this.bindCameraPresetInput(VehicleInputs.map.switchToCameraPreset3, "frontLookingLeft");
        this.bindCameraPresetInput(VehicleInputs.map.switchToCameraPreset4, "frontLookingRight");
    }

    private bindCameraPresetInput(input: CameraPresetInput, presetName: ThirdPersonCameraPresetNames) {
        const handler = () => {
            this.resetCamera(presetName);
        };

        input.on("complete", handler);
    }

    private resetCamera(presetName: ThirdPersonCameraPresetNames) {
        this.thirdPersonCameraAnimation = CustomAnimation.FromTo(
            {
                alpha: this.thirdPersonCamera.alpha,
                beta: this.thirdPersonCamera.beta,
                radius: this.thirdPersonCamera.radius,
                target: this.thirdPersonCamera.target.clone(),
            },
            thirdPersonCameraPresets[presetName],
            (from, to, progress) => ({
                alpha: lerpAngle(from.alpha, to.alpha, progress),
                beta: lerpAngle(from.beta, to.beta, progress),
                radius: lerp(from.radius, to.radius, progress),
                target: Vector3.Lerp(from.target, to.target, progress),
            }),
            1.0,
            {
                easing: easeInOutCubic,
            },
        );
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
            this.firstPersonCamera.parent = null;
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
        const deltaRotation = Quaternion.FromUnitVectorsToRef(this.thirdPersonTransform.up, up, Quaternion.Identity());

        this.thirdPersonTransform.rotationQuaternion = deltaRotation.multiply(
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
        if (horizontalSpeed > 0.1) {
            const horizontalDirection = horizontalVelocity.normalizeToNew();

            const deltaRotation = Quaternion.FromUnitVectorsToRef(
                this.thirdPersonTransform.forward,
                horizontalDirection,
                Quaternion.Identity(),
            );
            const targetRotation = deltaRotation.multiply(
                this.thirdPersonTransform.rotationQuaternion ?? Quaternion.Identity(),
            );
            const rotationHalfLife = 0.1;
            const rotationT = lerpSmooth(0, 1, rotationHalfLife, deltaSeconds) * smoothstep(2, 4, horizontalSpeed);
            this.thirdPersonTransform.rotationQuaternion = Quaternion.Slerp(
                this.thirdPersonTransform.rotationQuaternion ?? Quaternion.Identity(),
                targetRotation,
                rotationT,
            );
        }

        this.thirdPersonTransform.computeWorldMatrix(true);

        if (this.thirdPersonCameraAnimation !== null) {
            this.thirdPersonCameraAnimation.update(deltaSeconds);
            const { radius, alpha, beta, target } = this.thirdPersonCameraAnimation.getCurrentValue();
            this.thirdPersonCamera.target = target;
            this.thirdPersonCamera.radius = radius;
            this.thirdPersonCamera.alpha = alpha;
            this.thirdPersonCamera.beta = beta;
            if (this.thirdPersonCameraAnimation.isFinished()) {
                this.thirdPersonCameraAnimation = null;
            }
        }

        this.getActiveCamera().getViewMatrix(true);

        const steeringSpeed = VehicleInputs.map.steer.value * 1.8;
        vehicle.turn(steeringSpeed, deltaSeconds);
        vehicle.setBoostEnabled(VehicleInputs.map.boost.value > 0);

        if (VehicleInputs.map.brake.value > 0) {
            vehicle.brake();
        } else {
            const vehicleMaxAcceleration = 0.7 * EarthG;
            const vehicleAcceleration = VehicleInputs.map.accelerate.value * vehicleMaxAcceleration;
            vehicle.accelerate(vehicleAcceleration, deltaSeconds);
        }

        return;
    }
}
