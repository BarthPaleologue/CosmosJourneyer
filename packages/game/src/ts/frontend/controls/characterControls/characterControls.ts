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
import { degreesToRadians } from "@cosmos-journeyer/physics";

import { lerpSmooth } from "@/utils/math";

import { Settings } from "@/settings";

import { type Controls } from "../";
import { CharacterInputs } from "./characterControlsInputs";
import type { HumanoidAvatar } from "./humanoidAvatar";

export class CharacterControls implements Controls {
    readonly firstPersonCamera: FreeCamera;
    readonly thirdPersonCamera: ArcRotateCamera;
    private activeCamera: Camera;

    private readonly characterRotationSpeed = 4;

    private thirdPersonCameraScreenTargetOffsetX = 0;

    readonly avatar: HumanoidAvatar;
    private readonly headTransform: TransformNode;

    private lastUserCameraChangeTime = 0;
    private elapsedSeconds = 0;
    private readonly autoFramingCooldown = 5;
    private expectedCameraAlpha: number;
    private expectedCameraBeta: number;
    private expectedCameraRadius: number;

    constructor(avatar: HumanoidAvatar, scene: Scene) {
        this.avatar = avatar;
        this.headTransform = new TransformNode("characterHeadTransform", scene);
        this.headTransform.attachToBone(this.avatar.instance.head.bone, this.avatar.instance.head.attachmentMesh);

        this.firstPersonCamera = new FreeCamera("characterFirstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.speed = 0;
        this.firstPersonCamera.minZ = 1;
        this.firstPersonCamera.parent = this.getTransform();

        const thirdPersonInitialRadius = 3;
        this.thirdPersonCamera = new ArcRotateCamera(
            "characterThirdPersonCamera",
            Math.PI / 2,
            Math.PI / 2 - Math.PI / 12,
            thirdPersonInitialRadius,
            new Vector3(0, 1.5, 0),
            scene,
        );
        this.thirdPersonCamera.lowerRadiusLimit = 2;
        this.thirdPersonCamera.upperRadiusLimit = 100;
        this.thirdPersonCamera.minZ = 1;
        this.thirdPersonCamera.maxZ = Settings.EARTH_RADIUS * 5;
        this.thirdPersonCamera.wheelPrecision *= 3;
        this.thirdPersonCamera.targetScreenOffset.x = thirdPersonInitialRadius * 0.33;
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

        CharacterInputs.map.sitOnGround.on("complete", () => {
            this.avatar.sitOnGround();
        });

        this.expectedCameraAlpha = this.thirdPersonCamera.alpha;
        this.expectedCameraBeta = this.thirdPersonCamera.beta;
        this.expectedCameraRadius = this.thirdPersonCamera.radius;
    }

    public setFirstPersonCameraActive() {
        this.activeCamera = this.firstPersonCamera;
    }

    public setThirdPersonCameraActive() {
        this.activeCamera = this.thirdPersonCamera;
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

    public getEyesPosition(): Vector3 {
        return this.headTransform
            .getAbsolutePosition()
            .add(this.headTransform.forward.scale(-0.15))
            .add(this.headTransform.up.scale(0.05));
    }

    public update(deltaSeconds: number): void {
        this.elapsedSeconds += deltaSeconds;

        const inverseTransform = this.getTransform().getWorldMatrix().clone().invert();
        this.headTransform.computeWorldMatrix(true);
        this.firstPersonCamera.position = Vector3.TransformCoordinates(this.getEyesPosition(), inverseTransform);

        this.getTransform().rotate(Axis.Y, this.firstPersonCamera.rotation.y, Space.LOCAL);
        this.getTransform().computeWorldMatrix(true);
        this.firstPersonCamera.rotation.y = 0;
        this.firstPersonCamera.getViewMatrix(true);

        this.avatar.update(deltaSeconds);

        const [xMove, yMove] = CharacterInputs.map.move.value;

        // https://playground.babylonjs.com/#AJA5J6#77

        this.avatar.move(xMove, yMove, CharacterInputs.map.run.value);

        const avatarState = this.avatar.getState();
        if (avatarState === "swimming") {
            this.avatar
                .getTransform()
                .translate(
                    this.avatar.getTransform().up,
                    CharacterInputs.map.swimVertical.value * this.avatar.swimVerticalSpeed * deltaSeconds,
                    Space.WORLD,
                );
        }

        const isMoving = xMove !== 0 || yMove !== 0;

        if (this.activeCamera === this.thirdPersonCamera) {
            this.detectUserCameraChange();
        }

        // Rotation
        if (this.activeCamera === this.thirdPersonCamera && isMoving) {
            const dtheta = -Math.sign(xMove) * this.characterRotationSpeed * deltaSeconds;
            this.getTransform().rotate(Vector3.Up(), dtheta);
            this.thirdPersonCamera.alpha += dtheta;

            const cameraPosition = this.thirdPersonCamera.target;
            cameraPosition.applyRotationQuaternionInPlace(Quaternion.RotationAxis(Vector3.Up(), -dtheta));
            this.thirdPersonCamera.target = cameraPosition;
            this.getTransform().computeWorldMatrix(true);
        } else if (this.activeCamera === this.firstPersonCamera) {
            this.getTransform().position.addInPlace(
                this.getTransform().right.scale(-xMove * this.avatar.walkSpeed * deltaSeconds),
            );
        }

        if (this.activeCamera === this.thirdPersonCamera) {
            this.updateThirdPersonCameraFraming(deltaSeconds);
            this.expectedCameraAlpha = this.thirdPersonCamera.alpha;
            this.expectedCameraBeta = this.thirdPersonCamera.beta;
            this.expectedCameraRadius = this.thirdPersonCamera.radius;
        }

        this.getActiveCamera().getViewMatrix(true);
    }

    /**
     * Detects if the user has manually changed the camera (alpha, beta or radius)
     * since the last frame, and updates the cooldown timer accordingly.
     */
    private detectUserCameraChange(): void {
        const eps = 1e-4;
        if (
            Math.abs(this.thirdPersonCamera.alpha - this.expectedCameraAlpha) > eps ||
            Math.abs(this.thirdPersonCamera.beta - this.expectedCameraBeta) > eps ||
            Math.abs(this.thirdPersonCamera.radius - this.expectedCameraRadius) > eps
        ) {
            this.lastUserCameraChangeTime = this.elapsedSeconds;
        }
    }

    /**
     * Adjusts the 3rd person camera framing to obey the rule of thirds.
     */
    private updateThirdPersonCameraFraming(deltaSeconds: number): void {
        if (this.elapsedSeconds - this.lastUserCameraChangeTime < this.autoFramingCooldown) {
            return;
        }

        const cameraForward = this.thirdPersonCamera.getForwardRay().direction;
        const characterForward = this.getTransform().forward;
        const characterUp = this.getTransform().up;
        const cameraCharacterCross = cameraForward.cross(characterForward);
        const cosTheta = cameraForward.dot(characterForward);
        const sinTheta = cameraCharacterCross.dot(characterUp);
        const angle = Math.atan2(sinTheta, cosTheta);
        const absAngle = Math.abs(angle);

        const isLookingLeft = angle > 0;

        const angularDeadZone = degreesToRadians(20);
        const angleCorrectionHalfLife = 1.2;
        if (absAngle > angularDeadZone && absAngle < Math.PI / 2) {
            const correction = -angle;
            const target = this.thirdPersonCamera.alpha + correction;
            this.thirdPersonCamera.alpha = lerpSmooth(
                this.thirdPersonCamera.alpha,
                target,
                angleCorrectionHalfLife,
                deltaSeconds,
            );
        } else if (absAngle >= Math.PI / 2 && absAngle < Math.PI - angularDeadZone) {
            const targetAngle = Math.sign(angle) * Math.PI;
            const correction = targetAngle - angle;
            const target = this.thirdPersonCamera.alpha + correction;
            this.thirdPersonCamera.alpha = lerpSmooth(
                this.thirdPersonCamera.alpha,
                target,
                angleCorrectionHalfLife,
                deltaSeconds,
            );
        }

        this.thirdPersonCameraScreenTargetOffsetX = lerpSmooth(
            this.thirdPersonCameraScreenTargetOffsetX,
            (isLookingLeft ? 0.33 : -0.33) * this.thirdPersonCamera.radius,
            1.2,
            deltaSeconds,
        );

        this.thirdPersonCamera.targetScreenOffset.x = lerpSmooth(
            this.thirdPersonCamera.targetScreenOffset.x,
            this.thirdPersonCameraScreenTargetOffsetX,
            0.5,
            deltaSeconds,
        );
    }

    dispose() {
        this.avatar.dispose();
        this.headTransform.dispose();
        this.firstPersonCamera.dispose();
        this.thirdPersonCamera.dispose();
    }
}
