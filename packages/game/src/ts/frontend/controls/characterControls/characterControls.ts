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
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Axis, Quaternion, Space } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";

import { Settings } from "@/settings";

import { type Controls } from "../";
import { CharacterInputs } from "./characterControlsInputs";
import type { HumanoidAvatar } from "./humanoidAvatar";

export class CharacterControls implements Controls {
    readonly firstPersonCamera: FreeCamera;
    readonly thirdPersonCamera: ArcRotateCamera;
    private activeCamera: Camera;

    private readonly characterRotationSpeed = 6;

    private readonly avatar: HumanoidAvatar;
    private readonly headTransform: TransformNode;

    constructor(avatar: HumanoidAvatar, scene: Scene) {
        this.avatar = avatar;
        this.headTransform = new TransformNode("characterHeadTransform", scene);
        this.headTransform.attachToBone(this.avatar.instance.head.bone, this.avatar.instance.head.attachmentMesh);

        this.firstPersonCamera = new FreeCamera("characterFirstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.speed = 0;
        this.firstPersonCamera.minZ = 1;
        this.firstPersonCamera.parent = this.getTransform();

        this.thirdPersonCamera = new ArcRotateCamera(
            "characterThirdPersonCamera",
            -1.0,
            Math.PI / 3,
            10,
            new Vector3(0, 1.5, 0),
            scene,
        );
        this.thirdPersonCamera.lowerRadiusLimit = 2;
        this.thirdPersonCamera.upperRadiusLimit = 500;
        this.thirdPersonCamera.minZ = 1;
        this.thirdPersonCamera.maxZ = Settings.EARTH_RADIUS * 5;
        this.thirdPersonCamera.wheelPrecision *= 3;
        this.thirdPersonCamera.parent = this.getTransform();

        this.activeCamera = this.firstPersonCamera;
        this.setFirstPersonCameraActive();

        CharacterInputs.map.toggleCamera.on("complete", () => {
            if (this.getActiveCamera() === this.thirdPersonCamera) {
                this.setFirstPersonCameraActive();
            } else {
                this.setThirdPersonCameraActive();
            }
        });

        CharacterInputs.map.dance.on("complete", () => {
            this.avatar.dance();
        });

        CharacterInputs.map.jump.on("complete", () => {
            this.avatar.jump();
        });
    }

    public setFirstPersonCameraActive() {
        this.activeCamera = this.firstPersonCamera;
        for (const mesh of this.getTransform().getChildMeshes()) {
            const material = mesh.material;
            if (material === null) {
                continue;
            }
            material.disableColorWrite = true;
        }
    }

    public setThirdPersonCameraActive() {
        this.activeCamera = this.thirdPersonCamera;
        for (const mesh of this.getTransform().getChildMeshes()) {
            const material = mesh.material;
            if (material === null) {
                continue;
            }
            material.disableColorWrite = false;
        }
    }

    public getActiveCamera(): Camera {
        return this.activeCamera;
    }

    public getCameras(): Camera[] {
        return [this.firstPersonCamera, this.thirdPersonCamera];
    }

    public getTransform(): TransformNode {
        return this.avatar.getTransform();
    }

    public shouldLockPointer(): boolean {
        return true;
    }

    public update(deltaSeconds: number): void {
        const inverseTransform = this.getTransform().getWorldMatrix().clone().invert();
        this.headTransform.computeWorldMatrix(true);
        this.firstPersonCamera.position = Vector3.TransformCoordinates(
            this.headTransform.getAbsolutePosition(),
            inverseTransform,
        );

        this.getTransform().rotate(Axis.Y, this.firstPersonCamera.rotation.y - Math.PI, Space.LOCAL);
        this.getTransform().computeWorldMatrix(true);
        this.firstPersonCamera.rotation.y = Math.PI;
        this.firstPersonCamera.getViewMatrix(true);

        this.avatar.update(deltaSeconds);

        const [xMove, yMove] = CharacterInputs.map.move.value;

        // https://playground.babylonjs.com/#AJA5J6#77

        this.avatar.move(xMove, yMove, CharacterInputs.map.run.value);

        const isMoving = xMove !== 0 || yMove !== 0;

        // Rotation
        if (this.activeCamera === this.thirdPersonCamera && isMoving) {
            const dtheta = -Math.sign(xMove) * this.characterRotationSpeed * deltaSeconds;
            this.getTransform().rotate(Vector3.Up(), dtheta);
            this.thirdPersonCamera.alpha += dtheta;

            const cameraPosition = this.thirdPersonCamera.target;
            cameraPosition.applyRotationQuaternionInPlace(Quaternion.RotationAxis(Vector3.Up(), -dtheta));
            this.thirdPersonCamera.target = cameraPosition;
        } else if (this.activeCamera === this.firstPersonCamera) {
            this.getTransform().position.addInPlace(
                this.getTransform().right.scale(xMove * this.avatar.walkSpeed * deltaSeconds),
            );
        }

        this.getActiveCamera().getViewMatrix(true);
    }

    dispose() {
        this.avatar.dispose();
        this.headTransform.dispose();
        this.firstPersonCamera.dispose();
        this.thirdPersonCamera.dispose();
    }
}
