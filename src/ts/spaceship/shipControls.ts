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
import { getUpwardDirection, pitch, roll, yaw } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Controls } from "../uberCore/controls";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Spaceship } from "./spaceship";
import { SpaceShipControlsInputs } from "./spaceShipControlsInputs";
import { createNotification } from "../utils/notification";
import { StarSystemInputs } from "../inputs/starSystemInputs";
import { pressInteractionToStrings } from "../utils/strings/inputControlsString";
import i18n from "../i18n";
import { Transformable } from "../architecture/transformable";
import { ManagesLandingPads } from "../utils/managesLandingPads";
import { Sounds } from "../assets/sounds";
import { LandingPadSize } from "../assets/procedural/landingPad/landingPad";
import { getGlobalKeyboardLayoutMap } from "../utils/keyboardAPI";
import { moveTowards } from "../utils/math";
import { CameraShakeAnimation } from "../uberCore/transforms/animations/cameraShake";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Lerp } from "@babylonjs/core/Maths/math.scalar.functions";
import { quickAnimation } from "../uberCore/transforms/animations/quickAnimation";

export class ShipControls implements Controls {
    readonly spaceship: Spaceship;

    readonly thirdPersonCamera: ArcRotateCamera;
    readonly firstPersonCamera: FreeCamera;

    private readonly cameraShakeAnimation: CameraShakeAnimation;

    private readonly scene: Scene;

    private isCameraShaking = false;

    static BASE_CAMERA_RADIUS = 60;

    private closestLandableFacility: (Transformable & ManagesLandingPads) | null = null;

    private targetFov = Tools.ToRadians(60);

    private readonly toggleWarpDriveHandler: () => void;
    private readonly landingHandler: () => void;
    private readonly emitLandingRequestHandler: () => void;
    private readonly throttleToZeroHandler: () => void;
    private readonly resetCameraHandler: () => void;

    constructor(spaceship: Spaceship, scene: Scene) {
        this.spaceship = spaceship;

        this.firstPersonCamera = new FreeCamera("shipFirstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.getTransform();
        this.firstPersonCamera.position = new Vector3(0, 1.2, 4);

        this.thirdPersonCamera = new ArcRotateCamera("shipThirdPersonCamera", -3.14 / 2, 3.14 / 2.2, ShipControls.BASE_CAMERA_RADIUS, Vector3.Zero(), scene);
        this.thirdPersonCamera.parent = this.getTransform();
        this.thirdPersonCamera.lowerRadiusLimit = 10;
        this.thirdPersonCamera.upperRadiusLimit = 500;

        this.cameraShakeAnimation = new CameraShakeAnimation(this.thirdPersonCamera, 0.006, 1.0);

        this.scene = scene;

        this.toggleWarpDriveHandler = async () => {
            if (!this.spaceship.canEngageWarpDrive() && this.spaceship.getWarpDrive().isDisabled()) {
                Sounds.CANNOT_ENGAGE_WARP_DRIVE.play();
                return;
            }

            const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();

            this.spaceship.toggleWarpDrive();
            if (this.spaceship.getWarpDrive().isEnabled()) {
                Sounds.ENGAGING_WARP_DRIVE.play();
                this.cameraShakeAnimation.reset();
                this.spaceship.setMainEngineThrottle(0);
            } else {
                Sounds.WARP_DRIVE_DISENGAGED.play();
                this.cameraShakeAnimation.reset();

                if (this.closestLandableFacility !== null) {
                    const distanceToLandingFacility = Vector3.Distance(
                        this.getTransform().getAbsolutePosition(),
                        this.closestLandableFacility.getTransform().getAbsolutePosition()
                    );
                    if (distanceToLandingFacility < 500e3) {
                        const bindingsString = pressInteractionToStrings(SpaceShipControlsInputs.map.emitLandingRequest, keyboardLayoutMap).join(", ");
                        createNotification(`Don't forget to send a landing request with ${bindingsString} before approaching the facility`, 5000);
                    }
                }
            }
        };

        SpaceShipControlsInputs.map.toggleWarpDrive.on("complete", this.toggleWarpDriveHandler);

        this.landingHandler = async () => {
            const keyboardLayout = await getGlobalKeyboardLayoutMap();
            if (this.spaceship.isWarpDriveEnabled()) {
                const relevantKeys = pressInteractionToStrings(SpaceShipControlsInputs.map.toggleWarpDrive, keyboardLayout);
                createNotification(`Cannot land while warp drive is enabled. You can use ${relevantKeys} to toggle your warp drive.`, 5000);
                return;
            }

            const closestWalkableObject = this.spaceship.getClosestWalkableObject();
            if (closestWalkableObject === null) return;

            const distance = Vector3.Distance(this.getTransform().getAbsolutePosition(), closestWalkableObject.getTransform().getAbsolutePosition());

            // If the object is too far, don't engage landing
            if (distance > closestWalkableObject.getBoundingRadius() + 100e3) {
                createNotification("Too high to land", 2000);
                return;
            }

            this.spaceship.engagePlanetaryLanding(null);
        };

        SpaceShipControlsInputs.map.landing.on("complete", this.landingHandler);

        this.emitLandingRequestHandler = () => {
            if (this.spaceship.isLanded() || this.spaceship.isLanding()) return;
            if (this.closestLandableFacility === null) return;
            const landingPad = this.closestLandableFacility.handleLandingRequest({ minimumPadSize: LandingPadSize.SMALL });
            if (landingPad === null) {
                createNotification("Landing request rejected", 2000);
                return;
            }

            Sounds.EnqueuePlay(Sounds.LANDING_REQUEST_GRANTED);
            Sounds.STRAUSS_BLUE_DANUBE.play();
            Sounds.STRAUSS_BLUE_DANUBE.setVolume(1, 1);
            createNotification(`Landing request granted. Proceed to pad ${landingPad.padNumber}`, 30000);
            this.spaceship.engageLandingOnPad(landingPad);
        };

        SpaceShipControlsInputs.map.emitLandingRequest.on("complete", this.emitLandingRequestHandler);

        this.throttleToZeroHandler = () => {
            this.spaceship.setMainEngineThrottle(0);
            this.spaceship.getWarpDrive().increaseThrottle(-this.spaceship.getWarpDrive().getThrottle());
        };

        SpaceShipControlsInputs.map.throttleToZero.on("complete", this.throttleToZeroHandler);

        this.resetCameraHandler = () => {
            quickAnimation(this.thirdPersonCamera, "alpha", this.thirdPersonCamera.alpha, -3.14 / 2, 200);
            quickAnimation(this.thirdPersonCamera, "beta", this.thirdPersonCamera.beta, 3.14 / 2.2, 200);
            quickAnimation(this.thirdPersonCamera, "radius", this.thirdPersonCamera.radius, ShipControls.BASE_CAMERA_RADIUS, 200);
            quickAnimation(this.thirdPersonCamera, "target", this.thirdPersonCamera.target, Vector3.Zero(), 200);
        };

        SpaceShipControlsInputs.map.resetCamera.on("complete", this.resetCameraHandler);

        this.spaceship.onFuelScoopStart.add(() => {
            Sounds.EnqueuePlay(Sounds.FUEL_SCOOPING_VOICE);
        });

        this.spaceship.onFuelScoopEnd.add(() => {
            Sounds.EnqueuePlay(Sounds.FUEL_SCOOPING_COMPLETE_VOICE);
        });

        this.spaceship.onLandingObservable.add(async () => {
            const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
            Sounds.EnqueuePlay(Sounds.LANDING_COMPLETE);
            Sounds.STRAUSS_BLUE_DANUBE.setVolume(0, 2);
            Sounds.STRAUSS_BLUE_DANUBE.stop(2);

            if (!this.spaceship.isLandedAtFacility()) {
                const bindingsString = pressInteractionToStrings(StarSystemInputs.map.toggleSpaceShipCharacter, keyboardLayoutMap).join(", ");
                createNotification(i18n.t("notifications:landingComplete", { bindingsString: bindingsString }), 5000);
            }
        });

        this.spaceship.onPlanetaryLandingEngaged.add(() => {
            createNotification(i18n.t("notifications:landingSequenceEngaged"), 5000);
            Sounds.EnqueuePlay(Sounds.INITIATING_PLANETARY_LANDING);
        });

        this.spaceship.onLandingCancelled.add(() => {
            createNotification(i18n.t("notifications:landingCancelled"), 5000);
            Sounds.STRAUSS_BLUE_DANUBE.setVolume(0, 2);
            Sounds.STRAUSS_BLUE_DANUBE.stop(2);
        });

        this.spaceship.onTakeOff.add(() => {
            //FIXME: localize
            createNotification("Takeoff successful", 2000);
        });

        this.spaceship.onWarpDriveDisabled.add((isEmergency) => {
            if (isEmergency) Sounds.WARP_DRIVE_EMERGENCY_SHUT_DOWN.play();
        });
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

    public getClosestLandableFacility(): (Transformable & ManagesLandingPads) | null {
        return this.closestLandableFacility;
    }

    public update(deltaSeconds: number): Vector3 {
        this.spaceship.update(deltaSeconds);

        if (!this.cameraShakeAnimation.isFinished()) this.cameraShakeAnimation.update(deltaSeconds);

        let [inputRoll, inputPitch] = SpaceShipControlsInputs.map.rollPitch.value;
        if (SpaceShipControlsInputs.map.ignorePointer.value > 0) {
            inputRoll *= 0;
            inputPitch *= 0;
        }

        if (this.spaceship.getWarpDrive().isDisabled()) {
            this.spaceship.increaseMainEngineThrottle(deltaSeconds * SpaceShipControlsInputs.map.throttle.value);

            if (SpaceShipControlsInputs.map.upDown.value !== 0) {
                if (this.spaceship.isLanded()) {
                    this.spaceship.takeOff();
                } else if (this.spaceship.isLanding()) {
                    this.spaceship.cancelLanding();
                }
                this.spaceship.aggregate.body.applyForce(
                    getUpwardDirection(this.getTransform()).scale(9.8 * 10 * SpaceShipControlsInputs.map.upDown.value),
                    this.spaceship.aggregate.body.getObjectCenterWorld()
                );
            }
        } else {
            this.spaceship.getWarpDrive().increaseThrottle(0.5 * deltaSeconds * SpaceShipControlsInputs.map.throttle.value);
        }

        if (!this.spaceship.isLanded()) {
            roll(this.getTransform(), 2.0 * inputRoll * deltaSeconds);
            yaw(this.getTransform(), -1.0 * inputRoll * deltaSeconds);
            pitch(this.getTransform(), 3.0 * inputPitch * deltaSeconds);
        }

        // camera shake
        if (this.isCameraShaking) {
            this.thirdPersonCamera.alpha += (Math.random() - 0.5) / 100;
            this.thirdPersonCamera.beta += (Math.random() - 0.5) / 100;
            this.thirdPersonCamera.radius += (Math.random() - 0.5) / 100;
        }

        this.targetFov = Tools.ToRadians(60 + 10 * this.spaceship.getThrottle());

        this.thirdPersonCamera.fov = Lerp(this.thirdPersonCamera.fov, this.targetFov, 0.4);

        this.getActiveCameras().forEach((camera) => camera.getViewMatrix(true));

        return this.getTransform().getAbsolutePosition();
    }

    dispose() {
        SpaceShipControlsInputs.map.toggleWarpDrive.off("complete", this.toggleWarpDriveHandler);
        SpaceShipControlsInputs.map.landing.off("complete", this.landingHandler);
        SpaceShipControlsInputs.map.emitLandingRequest.off("complete", this.emitLandingRequestHandler);
        SpaceShipControlsInputs.map.throttleToZero.off("complete", this.throttleToZeroHandler);
        SpaceShipControlsInputs.map.resetCamera.off("complete", this.resetCameraHandler);

        this.spaceship.dispose();
        this.thirdPersonCamera.dispose();
        this.firstPersonCamera.dispose();
    }
}
