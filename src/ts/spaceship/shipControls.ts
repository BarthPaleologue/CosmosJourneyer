//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getUpwardDirection, pitch, roll } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Controls } from "../uberCore/controls";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Spaceship } from "./spaceship";
import { SpaceShipControlsInputs } from "./spaceShipControlsInputs";
import { moveTowards } from "../utils/moveTowards";
import { createNotification } from "../utils/notification";
import { StarSystemInputs } from "../inputs/starSystemInputs";
import { buttonInputToString, pressInteractionToStrings } from "../utils/inputControlsString";
import { ButtonInputControl } from "@brianchirls/game-input/browser";
import i18n from "../i18n";

export class ShipControls implements Controls {
    readonly spaceship: Spaceship;

    readonly thirdPersonCamera: ArcRotateCamera;
    readonly firstPersonCamera: FreeCamera;

    private readonly scene: Scene;

    private isCameraShaking = false;

    static BASE_CAMERA_RADIUS = 60;

    private baseFov: number;
    private targetFov: number;

    constructor(scene: Scene) {
        this.spaceship = new Spaceship(scene);

        this.firstPersonCamera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.getTransform();
        this.firstPersonCamera.position = new Vector3(0, 1.2, 4);

        this.thirdPersonCamera = new ArcRotateCamera("thirdPersonCamera", -3.14 / 2, 3.14 / 2.2, ShipControls.BASE_CAMERA_RADIUS, Vector3.Zero(), scene);
        this.thirdPersonCamera.parent = this.getTransform();
        this.thirdPersonCamera.lowerRadiusLimit = 10;
        this.thirdPersonCamera.upperRadiusLimit = 500;

        this.scene = scene;

        SpaceShipControlsInputs.map.toggleWarpDrive.on("complete", () => {
            this.spaceship.toggleWarpDrive();
        });

        SpaceShipControlsInputs.map.landing.on("complete", () => {
            if (this.spaceship.getClosestWalkableObject() !== null) {
                this.spaceship.engageLanding(null);
            }
        });

        SpaceShipControlsInputs.map.throttleToZero.on("complete", () => {
            this.spaceship.setMainEngineThrottle(0);
            this.spaceship.getWarpDrive().increaseTargetThrottle(-this.spaceship.getWarpDrive().getThrottle());
        });

        this.baseFov = this.thirdPersonCamera.fov;
        this.targetFov = this.baseFov;

        this.spaceship.onWarpDriveEnabled.add(() => {
            this.shakeCamera(2000);
            this.targetFov = this.baseFov * 3.0;
        });

        this.spaceship.onWarpDriveDisabled.add(() => {
            this.shakeCamera(2500);
            this.targetFov = this.baseFov * 0.5;
        });

        this.spaceship.onLandingObservable.add(() => {
            const bindingsString = pressInteractionToStrings(StarSystemInputs.map.toggleSpaceShipCharacter).join(", ");
            createNotification(i18n.t("notifications:landingComplete", { bindingsString: bindingsString }), 5000);
        });

        this.spaceship.onLandingEngaged.add(() => {
            createNotification(i18n.t("notifications:landingSequenceEngaged"), 5000);
        });
    }

    private shakeCamera(duration: number) {
        this.isCameraShaking = true;
        setTimeout(() => {
            this.isCameraShaking = false;
            this.targetFov = this.baseFov;
        }, duration);
    }

    public getTransform(): TransformNode {
        return this.spaceship.getTransform();
    }

    public getActiveCamera(): Camera {
        return this.thirdPersonCamera;
    }

    public update(deltaTime: number): Vector3 {
        this.spaceship.update(deltaTime);

        let [inputRoll, inputPitch] = SpaceShipControlsInputs.map.rollPitch.value;
        if (SpaceShipControlsInputs.map.ignorePointer.value > 0) {
            inputRoll *= 0;
            inputPitch *= 0;
        }

        if (this.spaceship.getWarpDrive().isDisabled()) {
            this.spaceship.increaseMainEngineThrottle(deltaTime * SpaceShipControlsInputs.map.throttle.value);

            if (SpaceShipControlsInputs.map.upDown.value !== 0) {
                if (this.spaceship.isLanded()) {
                    this.spaceship.takeOff();
                }
                this.spaceship.aggregate.body.applyForce(
                    getUpwardDirection(this.getTransform()).scale(9.8 * 10 * SpaceShipControlsInputs.map.upDown.value),
                    this.spaceship.aggregate.body.getObjectCenterWorld()
                );
            }
        } else {
            this.spaceship.getWarpDrive().increaseTargetThrottle(0.5 * deltaTime * SpaceShipControlsInputs.map.throttle.value);
        }

        if (!this.spaceship.isLanded()) {
            roll(this.getTransform(), 2.0 * inputRoll * deltaTime);
            pitch(this.getTransform(), 2.0 * inputPitch * deltaTime);
        }

        // camera shake
        if (this.isCameraShaking) {
            this.thirdPersonCamera.alpha += (Math.random() - 0.5) / 100;
            this.thirdPersonCamera.beta += (Math.random() - 0.5) / 100;
            this.thirdPersonCamera.radius += (Math.random() - 0.5) / 100;
        }

        this.thirdPersonCamera.fov = moveTowards(this.thirdPersonCamera.fov, this.targetFov, this.targetFov === this.baseFov ? 2.0 * deltaTime : 0.3 * deltaTime);

        this.getActiveCamera().getViewMatrix(true);

        return this.getTransform().getAbsolutePosition();
    }

    dispose() {
        this.spaceship.dispose();
        this.thirdPersonCamera.dispose();
        this.firstPersonCamera.dispose();
    }
}
