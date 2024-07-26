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
import { pressInteractionToStrings } from "../utils/inputControlsString";
import i18n from "../i18n";
import { Transformable } from "../architecture/transformable";
import { ManagesLandingPads } from "../utils/managesLandingPads";
import { Sounds } from "../assets/sounds";
import { LandingPadSize } from "../assets/procedural/landingPad/landingPad";

export class ShipControls implements Controls {
    readonly spaceship: Spaceship;

    readonly thirdPersonCamera: ArcRotateCamera;
    readonly firstPersonCamera: FreeCamera;

    private readonly scene: Scene;

    private isCameraShaking = false;

    static BASE_CAMERA_RADIUS = 60;

    private baseFov: number;
    private targetFov: number;

    private closestLandableFacility: (Transformable & ManagesLandingPads) | null = null;

    constructor(scene: Scene) {
        this.spaceship = new Spaceship(scene);

        this.firstPersonCamera = new FreeCamera("shipFirstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.getTransform();
        this.firstPersonCamera.position = new Vector3(0, 1.2, 4);

        this.thirdPersonCamera = new ArcRotateCamera("shipThirdPersonCamera", -3.14 / 2, 3.14 / 2.2, ShipControls.BASE_CAMERA_RADIUS, Vector3.Zero(), scene);
        this.thirdPersonCamera.parent = this.getTransform();
        this.thirdPersonCamera.lowerRadiusLimit = 10;
        this.thirdPersonCamera.upperRadiusLimit = 500;

        this.scene = scene;

        SpaceShipControlsInputs.map.toggleWarpDrive.on("complete", () => {
            this.spaceship.toggleWarpDrive();
            if (this.spaceship.getWarpDrive().isEnabled()) {
                Sounds.ENGAGING_WARP_DRIVE.play();
                this.shakeCamera(1500);
                this.targetFov = this.baseFov * 3.0;
            } else {
                Sounds.WARP_DRIVE_DISENGAGED.play();
                this.shakeCamera(1500);
                this.targetFov = this.baseFov * 0.5;

                if (this.closestLandableFacility !== null) {
                    const distanceToLandingFacility = Vector3.Distance(
                        this.getTransform().getAbsolutePosition(),
                        this.closestLandableFacility.getTransform().getAbsolutePosition()
                    );
                    if (distanceToLandingFacility < 500e3) {
                        const bindingsString = pressInteractionToStrings(SpaceShipControlsInputs.map.emitLandingRequest).join(", ");
                        createNotification(`Don't forget to send a landing request with ${bindingsString} before approaching the facility`, 5000);
                    }
                }
            }
        });

        SpaceShipControlsInputs.map.landing.on("complete", () => {
            if (this.spaceship.getClosestWalkableObject() !== null) {
                this.spaceship.engageLanding(null);
            }
        });

        SpaceShipControlsInputs.map.emitLandingRequest.on("complete", () => {
            if (this.spaceship.isLanded() || this.spaceship.isLanding()) return;
            if (this.closestLandableFacility === null) return;
            const landingPad = this.closestLandableFacility.handleLandingRequest({ minimumPadSize: LandingPadSize.SMALL });
            if (landingPad === null) {
                createNotification("Landing request rejected", 2000);
                return;
            }

            Sounds.LANDING_REQUEST_GRANTED.play();
            Sounds.STRAUSS_BLUE_DANUBE.play();
            Sounds.STRAUSS_BLUE_DANUBE.setVolume(1, 1);
            createNotification(`Landing request granted. Proceed to pad ${landingPad.padNumber}`, 30000);
            this.spaceship.engageLandingOnPad(landingPad);
        });

        SpaceShipControlsInputs.map.throttleToZero.on("complete", () => {
            this.spaceship.setMainEngineThrottle(0);
            this.spaceship.getWarpDrive().increaseThrottle(-this.spaceship.getWarpDrive().getThrottle());
        });

        this.baseFov = this.thirdPersonCamera.fov;
        this.targetFov = this.baseFov;

        this.spaceship.onLandingObservable.add(() => {
            Sounds.LANDING_COMPLETE.play();
            Sounds.STRAUSS_BLUE_DANUBE.setVolume(0, 2);
            Sounds.STRAUSS_BLUE_DANUBE.stop(2);

            if (!this.spaceship.isLandedAtFacility()) {
                const bindingsString = pressInteractionToStrings(StarSystemInputs.map.toggleSpaceShipCharacter).join(", ");
                createNotification(i18n.t("notifications:landingComplete", { bindingsString: bindingsString }), 5000);
            }
        });

        this.spaceship.onLandingEngaged.add(() => {
            createNotification(i18n.t("notifications:landingSequenceEngaged"), 5000);
        });

        this.spaceship.onWarpDriveDisabled.add((isEmergency) => {
            if (isEmergency) Sounds.WARP_DRIVE_EMERGENCY_SHUT_DOWN.play();
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

    public getActiveCameras(): Camera[] {
        return [this.thirdPersonCamera];
    }

    public setClosestLandableFacility(facility: (Transformable & ManagesLandingPads) | null) {
        this.closestLandableFacility = facility;
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
                    createNotification("Takeoff successful", 2000);
                }
                this.spaceship.aggregate.body.applyForce(
                    getUpwardDirection(this.getTransform()).scale(9.8 * 10 * SpaceShipControlsInputs.map.upDown.value),
                    this.spaceship.aggregate.body.getObjectCenterWorld()
                );
            }
        } else {
            this.spaceship.getWarpDrive().increaseThrottle(0.5 * deltaTime * SpaceShipControlsInputs.map.throttle.value);
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

        this.getActiveCameras().forEach((camera) => camera.getViewMatrix(true));

        return this.getTransform().getAbsolutePosition();
    }

    dispose() {
        this.spaceship.dispose();
        this.thirdPersonCamera.dispose();
        this.firstPersonCamera.dispose();
    }
}
