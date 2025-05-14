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
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Scene } from "@babylonjs/core/scene";

import { HasBoundingSphere } from "../architecture/hasBoundingSphere";
import { Transformable } from "../architecture/transformable";
import { RenderingAssets } from "../assets/renderingAssets";
import { ISoundPlayer } from "../audio/soundPlayer";
import { ITts, Speaker, VoiceLine } from "../audio/tts";
import i18n from "../i18n";
import { StarSystemInputs } from "../inputs/starSystemInputs";
import { LandingPadSize } from "../spacestation/landingPad/landingPadManager";
import { ManagesLandingPads } from "../spacestation/landingPad/managesLandingPads";
import { Controls } from "../uberCore/controls";
import { CameraShakeAnimation } from "../uberCore/transforms/animations/cameraShake";
import { quickAnimation } from "../uberCore/transforms/animations/quickAnimation";
import {
    getForwardDirection,
    getRightDirection,
    getUpwardDirection,
    pitch,
    roll,
    yaw,
} from "../uberCore/transforms/basicTransform";
import { getGlobalKeyboardLayoutMap } from "../utils/keyboardAPI";
import { lerpSmooth, slerpSmoothToRef } from "../utils/math";
import { createNotification, NotificationIntent, NotificationOrigin } from "../utils/notification";
import { pressInteractionToStrings } from "../utils/strings/inputControlsString";
import { canEngageWarpDrive } from "./components/warpDriveUtils";
import { Spaceship } from "./spaceship";
import { SpaceShipControlsInputs } from "./spaceShipControlsInputs";

export class ShipControls implements Controls {
    private spaceship: Spaceship;

    readonly thirdPersonCameraDefaultRadius = 60;
    readonly thirdPersonCameraDefaultAlpha = -3.14 / 2;
    readonly thirdPersonCameraDefaultBeta = 3.14 / 2.2;
    readonly thirdPersonCamera: ArcRotateCamera;

    readonly thirdPersonCameraTransform: TransformNode;

    readonly firstPersonCamera: FreeCamera;

    private readonly cameraShakeAnimation: CameraShakeAnimation;

    private closestLandableFacility: (Transformable & HasBoundingSphere & ManagesLandingPads) | null = null;

    private targetFov = Tools.ToRadians(60);

    readonly onToggleWarpDrive: Observable<boolean> = new Observable();

    readonly onCompleteLanding: Observable<void> = new Observable();

    private readonly rotationInertia = Vector3.Zero();

    private readonly toggleWarpDriveHandler: () => void;
    private readonly landingHandler: () => void;
    private readonly emitLandingRequestHandler: () => void;
    private readonly throttleToZeroHandler: () => void;
    private readonly resetCameraHandler: () => void;

    private readonly tts: ITts;
    private readonly soundPlayer: ISoundPlayer;

    constructor(spaceship: Spaceship, scene: Scene, soundPlayer: ISoundPlayer, tts: ITts) {
        this.spaceship = spaceship;

        this.soundPlayer = soundPlayer;
        this.tts = tts;

        this.firstPersonCamera = new FreeCamera("shipFirstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.getTransform();
        this.firstPersonCamera.position = new Vector3(0, 1.5, 8);

        this.thirdPersonCameraTransform = new TransformNode("thirdPersonCameraTransform", scene);

        this.thirdPersonCamera = new ArcRotateCamera(
            "shipThirdPersonCamera",
            this.thirdPersonCameraDefaultAlpha,
            this.thirdPersonCameraDefaultBeta,
            this.thirdPersonCameraDefaultRadius,
            Vector3.Zero(),
            scene,
        );
        this.thirdPersonCamera.parent = this.thirdPersonCameraTransform;
        this.thirdPersonCamera.lowerRadiusLimit =
            (1.2 *
                Math.max(
                    this.spaceship.boundingExtent.x,
                    this.spaceship.boundingExtent.y,
                    this.spaceship.boundingExtent.z,
                )) /
            2;
        this.thirdPersonCamera.upperRadiusLimit = 500;

        this.cameraShakeAnimation = new CameraShakeAnimation(this.thirdPersonCamera, 0.006, 1.0);

        this.toggleWarpDriveHandler = async () => {
            const spaceship = this.getSpaceship();
            const warpDrive = spaceship.getInternals().getWarpDrive();
            if (warpDrive === null) {
                return;
            }

            const nearestOrbitalObject = spaceship.getNearestOrbitalObject();
            if (
                warpDrive.isDisabled() &&
                nearestOrbitalObject !== null &&
                !canEngageWarpDrive(spaceship.getTransform(), 0, nearestOrbitalObject)
            ) {
                tts.sayNow(Speaker.CHARLOTTE, VoiceLine.CANNOT_ENGAGE_WARP_DRIVE);
                return;
            }

            const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();

            spaceship.toggleWarpDrive();
            if (warpDrive.isEnabled()) {
                tts.sayNow(Speaker.CHARLOTTE, VoiceLine.ENGAGING_WARP_DRIVE);
                this.cameraShakeAnimation.reset();
                spaceship.setMainEngineThrottle(0);
            } else {
                tts.sayNow(Speaker.CHARLOTTE, VoiceLine.WARP_DRIVE_DISENGAGED);
                this.cameraShakeAnimation.reset();

                if (this.closestLandableFacility !== null) {
                    const distanceToLandingFacility = Vector3.Distance(
                        this.getTransform().getAbsolutePosition(),
                        this.closestLandableFacility.getTransform().getAbsolutePosition(),
                    );
                    if (distanceToLandingFacility < 500e3) {
                        const bindingsString = pressInteractionToStrings(
                            SpaceShipControlsInputs.map.emitLandingRequest,
                            keyboardLayoutMap,
                        ).join(", ");
                        //FIXME: localize
                        createNotification(
                            NotificationOrigin.SPACE_STATION,
                            NotificationIntent.INFO,
                            `Don't forget to send a landing request with ${bindingsString} before approaching the facility`,
                            5000,
                            soundPlayer,
                        );
                    }
                }
            }
        };

        SpaceShipControlsInputs.map.toggleWarpDrive.on("complete", this.toggleWarpDriveHandler);

        this.landingHandler = async () => {
            const spaceship = this.getSpaceship();
            const warpDrive = spaceship.getInternals().getWarpDrive();
            if (warpDrive !== null && warpDrive.isEnabled()) {
                const keyboardLayout = await getGlobalKeyboardLayoutMap();
                const relevantKeys = pressInteractionToStrings(
                    SpaceShipControlsInputs.map.toggleWarpDrive,
                    keyboardLayout,
                );
                createNotification(
                    NotificationOrigin.SPACESHIP,
                    NotificationIntent.ERROR,
                    `Cannot land while warp drive is enabled. You can use ${relevantKeys.join(", ")} to toggle your warp drive.`,
                    5000,
                    soundPlayer,
                );
                return;
            }

            const closestWalkableObject = spaceship.getClosestWalkableObject();
            if (closestWalkableObject === null) return;

            const distance = Vector3.Distance(
                this.getTransform().getAbsolutePosition(),
                closestWalkableObject.getTransform().getAbsolutePosition(),
            );

            // If the object is too far, don't engage landing
            if (distance > closestWalkableObject.getBoundingRadius() + 100e3) {
                createNotification(
                    NotificationOrigin.SPACESHIP,
                    NotificationIntent.ERROR,
                    "Too high to land",
                    2000,
                    soundPlayer,
                );
                return;
            }

            spaceship.engageSurfaceLanding(closestWalkableObject.getTransform());
        };

        SpaceShipControlsInputs.map.landing.on("complete", this.landingHandler);

        this.emitLandingRequestHandler = () => {
            const spaceship = this.getSpaceship();
            if (spaceship.isLanded() || spaceship.isLanding()) return;
            if (this.closestLandableFacility === null) return;
            const landingPad = this.closestLandableFacility.getLandingPadManager().handleLandingRequest({
                minimumPadSize: LandingPadSize.SMALL,
            });
            if (landingPad === null) {
                createNotification(
                    NotificationOrigin.SPACE_STATION,
                    NotificationIntent.ERROR,
                    "Landing request rejected",
                    2000,
                    soundPlayer,
                );
                return;
            }

            tts.enqueueSay(Speaker.CHARLOTTE, VoiceLine.LANDING_REQUEST_GRANTED);
            createNotification(
                NotificationOrigin.SPACE_STATION,
                NotificationIntent.SUCCESS,
                `Landing request granted. Proceed to pad ${landingPad.getPadNumber()}`,
                30000,
                soundPlayer,
            );
            spaceship.engageLandingOnPad(landingPad);
        };

        SpaceShipControlsInputs.map.emitLandingRequest.on("complete", this.emitLandingRequestHandler);

        this.throttleToZeroHandler = () => {
            const spaceship = this.getSpaceship();
            spaceship.setMainEngineThrottle(0);

            const warpDrive = spaceship.getInternals().getWarpDrive();
            if (warpDrive !== null) {
                warpDrive.increaseThrottle(-warpDrive.getThrottle());
            }
        };

        SpaceShipControlsInputs.map.throttleToZero.on("complete", this.throttleToZeroHandler);

        this.resetCameraHandler = () => {
            quickAnimation(this.thirdPersonCamera, "alpha", this.thirdPersonCamera.alpha, -3.14 / 2, 200);
            quickAnimation(this.thirdPersonCamera, "beta", this.thirdPersonCamera.beta, 3.14 / 2.2, 200);
            quickAnimation(
                this.thirdPersonCamera,
                "radius",
                this.thirdPersonCamera.radius,
                this.thirdPersonCameraDefaultRadius,
                200,
            );
            quickAnimation(this.thirdPersonCamera, "target", this.thirdPersonCamera.target, Vector3.Zero(), 200);
        };

        SpaceShipControlsInputs.map.resetCamera.on("complete", this.resetCameraHandler);

        this.setSpaceship(spaceship);
    }

    public getTransform(): TransformNode {
        return this.getSpaceship().getTransform();
    }

    public shouldLockPointer(): boolean {
        return false;
    }

    public getActiveCamera(): Camera {
        return this.thirdPersonCamera;
    }

    public getCameras(): Camera[] {
        return [this.thirdPersonCamera, this.firstPersonCamera];
    }

    public setClosestLandableFacility(facility: (Transformable & HasBoundingSphere & ManagesLandingPads) | null) {
        this.closestLandableFacility = facility;
    }

    public getClosestLandableFacility(): (Transformable & HasBoundingSphere & ManagesLandingPads) | null {
        return this.closestLandableFacility;
    }

    public update(deltaSeconds: number): Vector3 {
        const spaceship = this.getSpaceship();
        spaceship.update(deltaSeconds);

        if (!this.cameraShakeAnimation.isFinished()) this.cameraShakeAnimation.update(deltaSeconds);

        let [inputRoll, inputPitch] = SpaceShipControlsInputs.map.rollPitch.value;
        if (SpaceShipControlsInputs.map.ignorePointer.value > 0 || spaceship.isAutoPiloted()) {
            inputRoll *= 0;
            inputPitch *= 0;
        }

        const warpDrive = spaceship.getInternals().getWarpDrive();
        if (warpDrive === null || warpDrive.isDisabled()) {
            spaceship.increaseMainEngineThrottle(deltaSeconds * SpaceShipControlsInputs.map.throttle.value);

            if (SpaceShipControlsInputs.map.upDown.value !== 0) {
                if (spaceship.isLanded()) {
                    const currentLandingPad = spaceship.getTargetLandingPad();
                    if (currentLandingPad !== null) {
                        this.closestLandableFacility?.getLandingPadManager().cancelLandingRequest(currentLandingPad);
                    }
                    spaceship.takeOff();
                } else if (spaceship.isLanding()) {
                    const currentLandingPad = spaceship.getTargetLandingPad();
                    if (currentLandingPad !== null) {
                        this.closestLandableFacility?.getLandingPadManager().cancelLandingRequest(currentLandingPad);
                    }
                    spaceship.cancelLanding();
                }
                spaceship.aggregate.body.applyForce(
                    getUpwardDirection(this.getTransform()).scale(9.8 * 10 * SpaceShipControlsInputs.map.upDown.value),
                    spaceship.aggregate.body.getObjectCenterWorld(),
                );
            }

            if (!spaceship.isLanded()) {
                const shipForward = getForwardDirection(this.getTransform());
                const shipUp = getUpwardDirection(this.getTransform());
                const shipRight = getRightDirection(this.getTransform());

                const angularVelocity = spaceship.aggregate.body.getAngularVelocity();

                const angularImpulse = Vector3.Zero();

                const authority = 0.7;

                const currentRoll = angularVelocity.dot(shipForward);
                const targetRoll = this.spaceship.maxRollSpeed * inputRoll;
                angularImpulse.addInPlace(shipForward.scale(authority * (targetRoll - currentRoll)));

                const currentYaw = angularVelocity.dot(shipUp);
                const targetYaw = -this.spaceship.maxYawSpeed * inputRoll;
                angularImpulse.addInPlace(shipUp.scale(authority * (targetYaw - currentYaw)));

                const currentPitch = angularVelocity.dot(shipRight);
                const targetPitch = -this.spaceship.maxPitchSpeed * inputPitch;
                angularImpulse.addInPlace(shipRight.scale(authority * (targetPitch - currentPitch)));

                spaceship.aggregate.body.applyAngularImpulse(angularImpulse);
            }
        } else {
            warpDrive.increaseThrottle(0.5 * deltaSeconds * SpaceShipControlsInputs.map.throttle.value);

            this.rotationInertia.x = lerpSmooth(this.rotationInertia.x, inputRoll, 0.07, deltaSeconds);
            this.rotationInertia.y = lerpSmooth(this.rotationInertia.y, inputPitch, 0.07, deltaSeconds);

            roll(this.getTransform(), this.spaceship.maxRollSpeed * this.rotationInertia.x * deltaSeconds);
            yaw(this.getTransform(), -this.spaceship.maxYawSpeed * this.rotationInertia.x * deltaSeconds);
            pitch(this.getTransform(), this.spaceship.maxPitchSpeed * this.rotationInertia.y * deltaSeconds);
        }

        this.thirdPersonCameraTransform.position =
            this.getTransform().parent === null
                ? this.getTransform().position
                : this.getTransform().getAbsolutePosition();
        this.thirdPersonCameraTransform.rotationQuaternion = slerpSmoothToRef(
            this.getTransform().absoluteRotationQuaternion,
            this.thirdPersonCameraTransform.rotationQuaternion ?? Quaternion.Identity(),
            0.3,
            deltaSeconds,
            this.thirdPersonCameraTransform.rotationQuaternion ?? Quaternion.Identity(),
        );
        this.thirdPersonCameraTransform.computeWorldMatrix(true);

        this.targetFov = Tools.ToRadians(60 + 10 * spaceship.getThrottle());
        this.thirdPersonCamera.fov = lerpSmooth(this.thirdPersonCamera.fov, this.targetFov, 0.08, deltaSeconds);

        this.getActiveCamera().getViewMatrix(true);

        return this.getTransform().getAbsolutePosition();
    }

    reset() {
        this.resetCameraHandler();
        this.cameraShakeAnimation.reset();
        this.closestLandableFacility = null;
    }

    setSpaceship(ship: Spaceship) {
        this.spaceship = ship;
        this.thirdPersonCamera.parent = this.thirdPersonCameraTransform;
        this.firstPersonCamera.parent = this.getTransform();

        this.spaceship.onFuelScoopStart.add(() => {
            this.tts.enqueueSay(Speaker.CHARLOTTE, VoiceLine.FUEL_SCOOPING);
        });

        this.spaceship.onFuelScoopEnd.add(() => {
            this.tts.enqueueSay(Speaker.CHARLOTTE, VoiceLine.FUEL_SCOOPING_COMPLETE);
        });

        this.spaceship.onLandingObservable.add(async () => {
            const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
            this.tts.enqueueSay(Speaker.CHARLOTTE, VoiceLine.LANDING_COMPLETE);

            if (!this.getSpaceship().isLandedAtFacility()) {
                const bindingsString = pressInteractionToStrings(
                    StarSystemInputs.map.toggleSpaceShipCharacter,
                    keyboardLayoutMap,
                ).join(", ");
                createNotification(
                    NotificationOrigin.SPACESHIP,
                    NotificationIntent.INFO,
                    i18n.t("notifications:landingComplete", { bindingsString: bindingsString }),
                    5000,
                    this.soundPlayer,
                );
            }
        });

        this.spaceship.onPlanetaryLandingEngaged.add(() => {
            createNotification(
                NotificationOrigin.SPACESHIP,
                NotificationIntent.INFO,
                i18n.t("notifications:landingSequenceEngaged"),
                5000,
                this.soundPlayer,
            );
            this.tts.enqueueSay(Speaker.CHARLOTTE, VoiceLine.INITIATING_PLANETARY_LANDING);
        });

        this.spaceship.onLandingCancelled.add(() => {
            createNotification(
                NotificationOrigin.SPACESHIP,
                NotificationIntent.INFO,
                i18n.t("notifications:landingCancelled"),
                5000,
                this.soundPlayer,
            );
        });

        this.spaceship.onTakeOff.add(() => {
            createNotification(
                NotificationOrigin.SPACESHIP,
                NotificationIntent.INFO,
                i18n.t("notifications:takeOffSuccess"),
                2000,
                this.soundPlayer,
            );
        });

        this.spaceship.onAutoPilotEngaged.add(() => {
            createNotification(
                NotificationOrigin.SPACESHIP,
                NotificationIntent.INFO,
                i18n.t("notifications:autoPilotEngaged"),
                30_000,
                this.soundPlayer,
            );
        });

        this.spaceship.onWarpDriveDisabled.add((isEmergency) => {
            if (isEmergency) this.tts.sayNow(Speaker.CHARLOTTE, VoiceLine.WARP_DRIVE_EMERGENCY_SHUT_DOWN);
            this.onToggleWarpDrive.notifyObservers(false);
        });

        this.spaceship.onWarpDriveEnabled.add(() => {
            this.onToggleWarpDrive.notifyObservers(true);
        });

        this.spaceship.onLandingObservable.add(() => {
            this.onCompleteLanding.notifyObservers();
        });
    }

    getSpaceship(): Spaceship {
        return this.spaceship;
    }

    static CreateDefault(scene: Scene, assets: RenderingAssets, tts: ITts, soundPlayer: ISoundPlayer) {
        return new ShipControls(Spaceship.CreateDefault(scene, assets, soundPlayer), scene, soundPlayer, tts);
    }

    dispose(soundPlayer: ISoundPlayer) {
        this.onToggleWarpDrive.clear();
        this.onCompleteLanding.clear();

        SpaceShipControlsInputs.map.toggleWarpDrive.off("complete", this.toggleWarpDriveHandler);
        SpaceShipControlsInputs.map.landing.off("complete", this.landingHandler);
        SpaceShipControlsInputs.map.emitLandingRequest.off("complete", this.emitLandingRequestHandler);
        SpaceShipControlsInputs.map.throttleToZero.off("complete", this.throttleToZeroHandler);
        SpaceShipControlsInputs.map.resetCamera.off("complete", this.resetCameraHandler);

        this.spaceship.dispose(soundPlayer);
        this.thirdPersonCamera.dispose();
        this.firstPersonCamera.dispose();
    }
}
