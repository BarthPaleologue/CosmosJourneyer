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

import { Controls } from "../uberCore/controls";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getForwardDirection, getRightDirection, getUpwardDirection, pitch, roll, setRotationQuaternion, translate, yaw } from "../uberCore/transforms/basicTransform";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { getTransformationQuaternion } from "../utils/algebra";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { LocalDirection } from "../uberCore/localDirections";
import { DefaultControlsInputs } from "./defaultControlsInputs";
import { Settings } from "../settings";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";

export class DefaultControls implements Controls {
    private readonly transform: TransformNode;
    private readonly camera: FreeCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    private inertia = Vector3.Zero();
    private rotationInertia = Vector3.Zero();

    constructor(scene: Scene) {
        this.transform = new TransformNode("playerController", scene);
        setRotationQuaternion(this.getTransform(), Quaternion.Identity());

        this.camera = new FreeCamera("defaultFirstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform;
        this.camera.speed = 0;
        this.camera.fov = Settings.FOV;
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

    public update(deltaSeconds: number): Vector3 {
        const inertiaFactor = Scalar.Clamp(deltaSeconds * 10, 0, 1);

        this.rotationInertia.x = Scalar.Lerp(this.rotationInertia.x, DefaultControlsInputs.map.roll.value, inertiaFactor);
        this.rotationInertia.y = Scalar.Lerp(this.rotationInertia.y, DefaultControlsInputs.map.pitch.value, inertiaFactor);
        this.rotationInertia.z = Scalar.Lerp(this.rotationInertia.z, DefaultControlsInputs.map.yaw.value, inertiaFactor);

        roll(this.transform, this.rotationInertia.x * this.rotationSpeed * deltaSeconds);
        pitch(this.transform, this.rotationInertia.y * this.rotationSpeed * deltaSeconds);
        yaw(this.transform, this.rotationInertia.z * this.rotationSpeed * deltaSeconds);

        const cameraForward = this.camera.getDirection(LocalDirection.BACKWARD);
        const transformForward = getForwardDirection(this.transform);

        if (!cameraForward.equalsWithEpsilon(transformForward)) {
            const rotation = getTransformationQuaternion(transformForward, cameraForward);
            this.transform.rotationQuaternion = rotation.multiply(this.transform.rotationQuaternion ?? Quaternion.Identity());
            this.camera.rotationQuaternion = Quaternion.Identity();
        }

        this.speed *= 1 + DefaultControlsInputs.map.changeSpeed.value / 20;

        this.inertia.x = Scalar.Lerp(this.inertia.x, DefaultControlsInputs.map.move.value[0], inertiaFactor);
        this.inertia.z = Scalar.Lerp(this.inertia.z, DefaultControlsInputs.map.move.value[1], inertiaFactor);
        this.inertia.y = Scalar.Lerp(this.inertia.y, DefaultControlsInputs.map.upDown.value, inertiaFactor);

        const displacement = Vector3.Zero();

        const forwardDisplacement = getForwardDirection(this.transform)
            .scale(this.speed * deltaSeconds)
            .scaleInPlace(this.inertia.z);
        const upwardDisplacement = getUpwardDirection(this.transform)
            .scale(this.speed * deltaSeconds)
            .scaleInPlace(this.inertia.y);
        const rightDisplacement = getRightDirection(this.transform)
            .scale(this.speed * deltaSeconds)
            .scaleInPlace(this.inertia.x);

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
