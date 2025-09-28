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

import "@babylonjs/core/Collisions/collisionCoordinator";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";

import { type Controls } from "@/frontend/controls";

import { Settings } from "@/settings";

import { lerpSmooth } from "../helpers/animations/interpolations";
import { StarMapInputs } from "./starMapInputs";

export class StarMapControls implements Controls {
    private readonly transform: TransformNode;
    readonly thirdPersonCamera: ArcRotateCamera;

    private speed = 10;
    private inertia = Vector3.Zero();

    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;

        this.transform = new TransformNode("starMapControls", scene);
        this.transform.rotationQuaternion = Quaternion.Identity();
        this.thirdPersonCamera = new ArcRotateCamera("camera", 0, Math.PI / 2, 10, Vector3.Zero(), scene);
        this.thirdPersonCamera.lowerRadiusLimit = 5;
        this.thirdPersonCamera.upperRadiusLimit = 100_000;
        this.thirdPersonCamera.minZ = 1;
        this.thirdPersonCamera.maxZ = Settings.EARTH_RADIUS * 5;
        this.thirdPersonCamera.wheelPrecision *= 3;
        this.thirdPersonCamera.panningSensibility = 0;
        this.thirdPersonCamera.parent = this.transform;
    }

    public getActiveCamera(): Camera {
        return this.thirdPersonCamera;
    }

    public getCameras(): Camera[] {
        return [this.thirdPersonCamera];
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    public shouldLockPointer(): boolean {
        return false;
    }

    public update(deltaSeconds: number): Vector3 {
        const inertiaFactor = 0.15;
        const [xMove, zMove] = StarMapInputs.map.move.value;
        this.inertia.x = lerpSmooth(this.inertia.x, xMove, inertiaFactor, deltaSeconds);
        this.inertia.z = lerpSmooth(this.inertia.z, zMove, inertiaFactor, deltaSeconds);

        const upDown = StarMapInputs.map.upDown.value;
        this.inertia.y = lerpSmooth(this.inertia.y, upDown, inertiaFactor, deltaSeconds);

        this.speed *= 1 + StarMapInputs.map.changeSpeed.value / 20;

        const cameraForward = this.thirdPersonCamera.getDirection(Vector3.Forward(this.scene.useRightHandedSystem));
        const cameraRight = this.thirdPersonCamera.getDirection(Vector3.Right());
        const cameraUp = this.thirdPersonCamera.getDirection(Vector3.Up());

        const displacement = cameraForward
            .scaleInPlace(this.inertia.z * deltaSeconds * this.speed)
            .addInPlace(cameraRight.scaleInPlace(this.inertia.x * deltaSeconds * this.speed))
            .addInPlace(cameraUp.scaleInPlace(this.inertia.y * deltaSeconds * this.speed));

        this.transform.position.addInPlace(displacement);

        return displacement;
    }

    public getSpeed(): number {
        return this.speed;
    }

    dispose() {
        this.transform.dispose();
        this.thirdPersonCamera.dispose();
    }
}
