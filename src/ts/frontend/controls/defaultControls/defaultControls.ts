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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";

import { getTransformationQuaternion } from "@/frontend/helpers/algebra";
import { pitch, roll, translate, yaw } from "@/frontend/helpers/transform";

import { lerpSmooth } from "@/utils/math";

import { Settings } from "@/settings";

import { type Controls } from "../";
import { DefaultControlsInputs } from "./defaultControlsInputs";

export class DefaultControls implements Controls {
    private readonly transform: TransformNode;
    private readonly camera: FreeCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    private inertia = Vector3.Zero();
    private rotationInertia = Vector3.Zero();

    constructor(scene: Scene) {
        this.transform = new TransformNode("playerController", scene);
        this.transform.rotationQuaternion = Quaternion.Identity();

        this.camera = new FreeCamera("defaultFirstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform;
        this.camera.speed = 0;
        this.camera.fov = Settings.FOV;
        this.camera.rotationQuaternion = Quaternion.Identity();
    }

    public getCameras(): Camera[] {
        return [this.camera];
    }

    public getActiveCamera(): Camera {
        return this.camera;
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    public shouldLockPointer(): boolean {
        return false;
    }

    public update(deltaSeconds: number): Vector3 {
        const inertiaHalfLifeSeconds = 0.07;

        this.rotationInertia.x = lerpSmooth(
            this.rotationInertia.x,
            DefaultControlsInputs.map.roll.value,
            inertiaHalfLifeSeconds,
            deltaSeconds,
        );
        this.rotationInertia.y = lerpSmooth(
            this.rotationInertia.y,
            DefaultControlsInputs.map.pitch.value,
            inertiaHalfLifeSeconds,
            deltaSeconds,
        );
        this.rotationInertia.z = lerpSmooth(
            this.rotationInertia.z,
            DefaultControlsInputs.map.yaw.value,
            inertiaHalfLifeSeconds,
            deltaSeconds,
        );

        roll(this.transform, this.rotationInertia.x * this.rotationSpeed * deltaSeconds);
        pitch(this.transform, this.rotationInertia.y * this.rotationSpeed * deltaSeconds);
        yaw(this.transform, this.rotationInertia.z * this.rotationSpeed * deltaSeconds);

        const localForward = Vector3.Forward(this.getTransform().getScene().useRightHandedSystem);

        const cameraForward = this.camera.getDirection(localForward);
        const transformForward = this.getTransform().forward;

        if (!cameraForward.equalsWithEpsilon(transformForward)) {
            const rotation = getTransformationQuaternion(transformForward, cameraForward);
            this.transform.rotationQuaternion = rotation.multiply(
                this.transform.rotationQuaternion ?? Quaternion.Identity(),
            );
            this.camera.rotationQuaternion = Quaternion.Identity();
        }

        this.speed *= 1 + DefaultControlsInputs.map.changeSpeed.value / 20;

        this.inertia.x = lerpSmooth(
            this.inertia.x,
            DefaultControlsInputs.map.move.value[0],
            inertiaHalfLifeSeconds,
            deltaSeconds,
        );
        this.inertia.z = lerpSmooth(
            this.inertia.z,
            DefaultControlsInputs.map.move.value[1],
            inertiaHalfLifeSeconds,
            deltaSeconds,
        );
        this.inertia.y = lerpSmooth(
            this.inertia.y,
            DefaultControlsInputs.map.upDown.value,
            inertiaHalfLifeSeconds,
            deltaSeconds,
        );

        const displacement = Vector3.Zero();

        const forwardDisplacement = this.transform.forward
            .scale(this.speed * deltaSeconds)
            .scaleInPlace(this.inertia.z);
        const upwardDisplacement = this.transform.up.scale(this.speed * deltaSeconds).scaleInPlace(this.inertia.y);
        const rightDisplacement = this.transform.right.scale(-this.speed * deltaSeconds).scaleInPlace(this.inertia.x);

        displacement.addInPlace(forwardDisplacement);
        displacement.addInPlace(upwardDisplacement);
        displacement.addInPlace(rightDisplacement);

        translate(this.transform, displacement);
        this.getActiveCamera().getViewMatrix();

        return displacement;
    }

    dispose() {
        this.transform.dispose();
        this.camera.dispose();
    }
}
