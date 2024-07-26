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

export class DefaultControls implements Controls {
    private readonly transform: TransformNode;
    private readonly camera: FreeCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    constructor(scene: Scene) {
        this.transform = new TransformNode("playerController", scene);
        setRotationQuaternion(this.getTransform(), Quaternion.Identity());

        this.camera = new FreeCamera("defaultFirstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform;
        this.camera.speed = 0;
        this.camera.fov = Settings.FOV;
    }

    public getActiveCameras(): Camera[] {
        return [this.camera];
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    public update(deltaTime: number): Vector3 {
        roll(this.transform, DefaultControlsInputs.map.roll.value * this.rotationSpeed * deltaTime);
        pitch(this.transform, DefaultControlsInputs.map.pitch.value * this.rotationSpeed * deltaTime);
        yaw(this.transform, DefaultControlsInputs.map.yaw.value * this.rotationSpeed * deltaTime);

        const cameraForward = this.camera.getDirection(LocalDirection.BACKWARD);
        const transformForward = getForwardDirection(this.transform);

        if (!cameraForward.equalsWithEpsilon(transformForward)) {
            const rotation = getTransformationQuaternion(transformForward, cameraForward);
            this.transform.rotationQuaternion = rotation.multiply(this.transform.rotationQuaternion ?? Quaternion.Identity());
            this.camera.rotationQuaternion = Quaternion.Identity();
        }

        this.speed *= 1 + DefaultControlsInputs.map.changeSpeed.value / 20;

        const displacement = Vector3.Zero();

        const forwardDisplacement = getForwardDirection(this.transform)
            .scale(this.speed * deltaTime)
            .scaleInPlace(DefaultControlsInputs.map.move.value[1]);
        const upwardDisplacement = getUpwardDirection(this.transform)
            .scale(this.speed * deltaTime)
            .scaleInPlace(DefaultControlsInputs.map.upDown.value);
        const rightDisplacement = getRightDirection(this.transform)
            .scale(this.speed * deltaTime)
            .scaleInPlace(DefaultControlsInputs.map.move.value[0]);

        displacement.addInPlace(forwardDisplacement);
        displacement.addInPlace(upwardDisplacement);
        displacement.addInPlace(rightDisplacement);

        translate(this.transform, displacement);
        this.getActiveCameras().forEach((camera) => camera.getViewMatrix());

        return displacement;
    }

    dispose() {
        this.transform.dispose();
        this.camera.dispose();
    }
}
