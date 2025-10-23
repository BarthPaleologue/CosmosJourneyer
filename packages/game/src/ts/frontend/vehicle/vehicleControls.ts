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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { Controls } from "../controls";
import { type Vehicle } from "./vehicle";
import { VehicleInputs } from "./vehicleControlsInputs";

export class VehicleControls implements Controls {
    private vehicle: Vehicle | null = null;

    private readonly thirdPersonCamera: ArcRotateCamera;

    private readonly firstPersonCamera: FreeCamera;

    private activeCamera: Camera;

    constructor(scene: Scene) {
        this.thirdPersonCamera = new ArcRotateCamera(
            "thirdPersonCamera",
            -Math.PI / 3,
            Math.PI / 3,
            20,
            Vector3.Zero(),
            scene,
        );

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
        this.thirdPersonCamera.parent = vehicle.getTransform();
        this.firstPersonCamera.parent = vehicle.getTransform();
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

    update(): void {
        const vehicle = this.getVehicle();
        if (vehicle === null) {
            return;
        }

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
