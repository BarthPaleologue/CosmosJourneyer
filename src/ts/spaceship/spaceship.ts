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
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { WarpDrive } from "./warpDrive";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { getForwardDirection, getRotationQuaternion, getUpwardDirection, rotate, setRotationQuaternion, translate } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { CollisionMask } from "../settings";
import { Transformable } from "../architecture/transformable";
import { WarpTunnel } from "../utils/warpTunnel";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { HyperSpaceTunnel } from "../utils/hyperSpaceTunnel";
import { AudioInstance } from "../utils/audioInstance";
import { AudioManager } from "../audio/audioManager";
import { MainThruster } from "./mainThruster";
import { AudioMasks } from "../audio/audioMasks";
import { Objects } from "../assets/objects";
import { Sounds } from "../assets/sounds";
import { LandingPad } from "../assets/procedural/landingPad/landingPad";
import { createNotification } from "../utils/notification";

const enum ShipState {
    FLYING,
    LANDING,
    LANDED
}

export class Spaceship implements Transformable {
    readonly instanceRoot: AbstractMesh;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private readonly warpDrive = new WarpDrive(false);

    private mainEngineThrottle = 0;
    private mainEngineTargetSpeed = 0;

    private closestWalkableObject: Transformable | null = null;

    private landingTarget: Transformable | null = null;
    private readonly raycastResult = new PhysicsRaycastResult();

    private state = ShipState.FLYING;

    private closestObject = {
        distance: 0,
        radius: 1
    };

    readonly warpTunnel: WarpTunnel;
    readonly hyperSpaceTunnel: HyperSpaceTunnel;

    private readonly scene: Scene;

    private targetLandingPad: LandingPad | null = null;

    private mainThrusters: MainThruster[] = [];

    readonly enableWarpDriveSound: AudioInstance;
    readonly disableWarpDriveSound: AudioInstance;
    readonly acceleratingWarpDriveSound: AudioInstance;
    readonly deceleratingWarpDriveSound: AudioInstance;
    readonly hyperSpaceSound: AudioInstance;
    readonly thrusterSound: AudioInstance;

    readonly onWarpDriveEnabled = new Observable<void>();
    readonly onWarpDriveDisabled = new Observable<void>();

    readonly onLandingEngaged = new Observable<void>();
    readonly onLandingObservable = new Observable<void>();

    constructor(scene: Scene) {
        this.instanceRoot = Objects.CreateWandererInstance();
        setRotationQuaternion(this.instanceRoot, Quaternion.Identity());

        this.aggregate = new PhysicsAggregate(
            this.instanceRoot,
            PhysicsShapeType.CONTAINER,
            {
                mass: 10,
                restitution: 0.2
            },
            scene
        );
        for (const child of this.instanceRoot.getChildMeshes()) {
            if (child.name.includes("mainThruster")) {
                const mainThruster = new MainThruster(child, getForwardDirection(this.instanceRoot).negate(), this.aggregate);
                this.mainThrusters.push(mainThruster);
                continue;
            }
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            childShape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;
            childShape.filterCollideMask = CollisionMask.ENVIRONMENT;
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;
        this.aggregate.body.setAngularDamping(0.9);

        this.aggregate.body.setCollisionCallbackEnabled(true);

        this.collisionObservable = this.aggregate.body.getCollisionObservable();
        this.collisionObservable.add((collisionEvent: IPhysicsCollisionEvent) => {
            console.log("Collision");
            if (collisionEvent.impulse < 0.8) return;
            console.log(collisionEvent);
        });

        this.warpTunnel = new WarpTunnel(this.getTransform(), scene);
        this.hyperSpaceTunnel = new HyperSpaceTunnel(this.getTransform().getDirection(Axis.Z), scene);
        this.hyperSpaceTunnel.setParent(this.getTransform());
        this.hyperSpaceTunnel.setEnabled(false);

        this.enableWarpDriveSound = new AudioInstance(Sounds.ENABLE_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 1, true, this.getTransform());
        this.disableWarpDriveSound = new AudioInstance(Sounds.DISABLE_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 1, true, this.getTransform());
        this.acceleratingWarpDriveSound = new AudioInstance(Sounds.ACCELERATING_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 0, false, this.getTransform());
        this.deceleratingWarpDriveSound = new AudioInstance(Sounds.DECELERATING_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 0, false, this.getTransform());
        this.hyperSpaceSound = new AudioInstance(Sounds.HYPER_SPACE_SOUND, AudioMasks.HYPER_SPACE, 0, false, this.getTransform());
        this.thrusterSound = new AudioInstance(Sounds.THRUSTER_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 0, false, this.getTransform());

        AudioManager.RegisterSound(this.enableWarpDriveSound);
        AudioManager.RegisterSound(this.disableWarpDriveSound);
        AudioManager.RegisterSound(this.acceleratingWarpDriveSound);
        AudioManager.RegisterSound(this.deceleratingWarpDriveSound);
        AudioManager.RegisterSound(this.hyperSpaceSound);
        AudioManager.RegisterSound(this.thrusterSound);

        this.thrusterSound.sound.play();
        this.acceleratingWarpDriveSound.sound.play();
        this.deceleratingWarpDriveSound.sound.play();
        this.hyperSpaceSound.sound.play();

        this.scene = scene;
    }

    public setClosestWalkableObject(object: Transformable) {
        this.closestWalkableObject = object;
    }

    public getTransform(): TransformNode {
        return this.aggregate.transformNode;
    }

    public setEnabled(enabled: boolean, havokPlugin: HavokPlugin) {
        this.instanceRoot.setEnabled(enabled);
        setEnabledBody(this.aggregate.body, enabled, havokPlugin);
    }

    public registerClosestObject(distance: number, radius: number) {
        this.closestObject = { distance, radius };
    }

    public enableWarpDrive() {
        this.warpDrive.enable();
        this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);

        this.aggregate.body.setLinearVelocity(Vector3.Zero());
        this.aggregate.body.setAngularVelocity(Vector3.Zero());

        this.thrusterSound.setTargetVolume(0);

        this.enableWarpDriveSound.sound.play();
        this.onWarpDriveEnabled.notifyObservers();
    }

    public disableWarpDrive() {
        this.warpDrive.desengage();
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.disableWarpDriveSound.sound.play();
        this.onWarpDriveDisabled.notifyObservers();
    }

    public toggleWarpDrive() {
        if (!this.warpDrive.isEnabled()) this.enableWarpDrive();
        else this.disableWarpDrive();
    }

    public setMainEngineThrottle(throttle: number) {
        this.mainEngineThrottle = throttle;
    }

    /**
     * Returns a readonly interface to the warp drive of the ship.
     * @returns A readonly interface to the warp drive of the ship.
     */
    public getWarpDrive(): WarpDrive {
        return this.warpDrive;
    }

    /**
     * Returns the speed of the ship in m/s
     * If warp drive is enabled, returns the warp speed
     * If warp drive is disabled, returns the linear velocity of the ship
     * @returns The speed of the ship in m/s
     */
    public getSpeed(): number {
        return this.warpDrive.isEnabled() ? this.warpDrive.getWarpSpeed() : this.aggregate.body.getLinearVelocity().dot(getForwardDirection(this.getTransform()));
    }

    public getThrottle(): number {
        return this.warpDrive.isEnabled() ? this.warpDrive.getThrottle() : this.mainEngineThrottle;
    }

    public increaseMainEngineThrottle(delta: number) {
        this.mainEngineThrottle = Math.max(-1, Math.min(1, this.mainEngineThrottle + delta));
    }

    public getClosestWalkableObject(): Transformable | null {
        return this.closestWalkableObject;
    }

    public engageLanding(landingTarget: Transformable | null) {
        console.log("Landing sequence engaged");
        this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this.state = ShipState.LANDING;
        this.landingTarget = landingTarget !== null ? landingTarget : this.closestWalkableObject;
        if (this.landingTarget === null) {
            throw new Error("Landing target is null");
        }

        this.onLandingEngaged.notifyObservers();
    }

    public engageLandingOnPad(landingPad: LandingPad) {
        console.log("Landing on pad", landingPad.getTransform().name);
        this.targetLandingPad = landingPad;
    }

    private completeLanding() {
        console.log("Landing sequence complete");
        this.state = ShipState.LANDED;

        this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
        this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
        this.aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;

        if(this.targetLandingPad !== null) {
            const currentPosition = this.getTransform().getAbsolutePosition().clone();
            const currentRotation = this.getTransform().absoluteRotationQuaternion.clone();
            const padRotation = this.targetLandingPad.getTransform().absoluteRotationQuaternion.clone();
            if(padRotation === null) {
                throw new Error("Landing pad's rotation quaternion is null!");
            }
            this.getTransform().parent = this.targetLandingPad.getTransform();
            this.getTransform().setAbsolutePosition(currentPosition);
            this.getTransform().rotationQuaternion = padRotation.invert().multiply(currentRotation);
        }

        this.landingTarget = null;
        this.targetLandingPad = null;

        this.onLandingObservable.notifyObservers();
    }

    public isLanded(): boolean {
        return this.state === ShipState.LANDED;
    }

    public takeOff() {
        this.state = ShipState.FLYING;
        this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
        this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS | CollisionMask.ENVIRONMENT;
        this.aggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;

    }

    private land(deltaTime: number) {
        if (this.landingTarget !== null) {
            const gravityDir = this.landingTarget.getTransform().getAbsolutePosition().subtract(this.getTransform().getAbsolutePosition()).normalize();
            const start = this.getTransform().getAbsolutePosition().add(gravityDir.scale(-50e3));
            const end = this.getTransform().getAbsolutePosition().add(gravityDir.scale(50e3));

            (this.scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, this.raycastResult, { collideWith: CollisionMask.ENVIRONMENT });
            if (this.raycastResult.hasHit) {
                const landingSpotNormal = this.raycastResult.hitNormalWorld;

                const landingSpot = this.raycastResult.hitPointWorld.add(this.raycastResult.hitNormalWorld.scale(1.0));

                const distance = landingSpot.subtract(this.getTransform().getAbsolutePosition()).dot(gravityDir);
                translate(this.getTransform(), gravityDir.scale(Math.min(10 * deltaTime * Math.sign(distance), distance)));

                const currentUp = getUpwardDirection(this.getTransform());
                const targetUp = landingSpotNormal;
                let theta = 0.0;
                if (Vector3.Distance(currentUp, targetUp) > 0.01) {
                    const axis = Vector3.Cross(currentUp, targetUp);
                    theta = Math.acos(Vector3.Dot(currentUp, targetUp));
                    rotate(this.getTransform(), axis, Math.min(0.4 * deltaTime, theta));
                }

                if (Math.abs(distance) < 0.3 && Math.abs(theta) < 0.01) {
                    this.completeLanding();
                }
            }
        }
    }

    private landOnPad(landingPad: LandingPad) {
        this.setMainEngineThrottle(0);

        const shipUp = this.getTransform().up;
        const padUp = landingPad.getTransform().up;

        const targetPosition = landingPad.getTransform().getAbsolutePosition();
        targetPosition.addInPlace(padUp.scale(1));

        const currentPosition = this.getTransform().getAbsolutePosition();

        const distance = Vector3.Distance(targetPosition, currentPosition);

        const directionToTarget = targetPosition.subtract(currentPosition).normalize();

        //const currentVelocity = this.aggregate.body.getLinearVelocity();
        //const unwantedVelocity = currentVelocity.subtract(directionToTarget.scale(Vector3.Dot(directionToTarget, currentVelocity)));
        //this.aggregate.body.applyForce(unwantedVelocity.scale(-1), currentPosition);
        //const forceMag = 2000;
        //this.aggregate.body.applyForce(directionToTarget.scale(forceMag), currentPosition);

        this.aggregate.body.setLinearVelocity(directionToTarget.scale(Math.min(Math.max(1, distance), 20)));

        if (distance < 3.0) {
            this.completeLanding();
            return;
        }

        const upRotationAxis = Vector3.Cross(shipUp, padUp);
        const upRotationAngle = Math.acos(Vector3.Dot(shipUp, padUp));

        this.aggregate.body.applyAngularImpulse(upRotationAxis.scale(upRotationAngle * 0.5));

        const shipForward = getForwardDirection(this.getTransform());
        const padBackward = getForwardDirection(landingPad.getTransform()).negateInPlace();

        const forwardRotationAxis = Vector3.Cross(shipForward, padBackward);
        const forwardRotationAngle = Math.acos(Vector3.Dot(shipForward, padBackward));

        this.aggregate.body.applyAngularImpulse(forwardRotationAxis.scale(forwardRotationAngle * 0.5));

        // dampen rotation that is not along any of the rotation axis
        const angularVelocity = this.aggregate.body.getAngularVelocity();
        const noiseAngularVelocity = angularVelocity.subtract(upRotationAxis.scale(Vector3.Dot(angularVelocity, upRotationAxis)));
        noiseAngularVelocity.subtractInPlace(forwardRotationAxis.scale(Vector3.Dot(noiseAngularVelocity, forwardRotationAxis)));
        this.aggregate.body.applyAngularImpulse(noiseAngularVelocity.scale(-0.1));
    }

    public update(deltaTime: number) {
        this.mainEngineTargetSpeed = Math.sign(this.mainEngineThrottle) * this.mainEngineThrottle ** 2 * 500;

        const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());

        const currentForwardSpeed = Vector3.Dot(warpSpeed, this.aggregate.transformNode.getDirection(Axis.Z));
        this.warpDrive.update(currentForwardSpeed, this.closestObject.distance, this.closestObject.radius, deltaTime);

        // the warp throttle goes from 0.1 to 1 smoothly using an inverse function
        if (this.warpDrive.isEnabled()) this.warpTunnel.setThrottle(1 - 1 / (1.1 * (1 + 1e-7 * this.warpDrive.getWarpSpeed())));
        else this.warpTunnel.setThrottle(0);

        if (this.warpDrive.isDisabled() && this.state !== ShipState.LANDED) {
            const linearVelocity = this.aggregate.body.getLinearVelocity();
            const forwardDirection = getForwardDirection(this.getTransform());
            const forwardSpeed = Vector3.Dot(linearVelocity, forwardDirection);

            const otherSpeed = linearVelocity.subtract(forwardDirection.scale(forwardSpeed));

            if (this.mainEngineThrottle !== 0) this.thrusterSound.setTargetVolume(1);
            else this.thrusterSound.setTargetVolume(0);

            if (forwardSpeed < this.mainEngineTargetSpeed) {
                this.aggregate.body.applyForce(forwardDirection.scale(3000), this.aggregate.body.getObjectCenterWorld());
            } else {
                this.aggregate.body.applyForce(forwardDirection.scale(-3000), this.aggregate.body.getObjectCenterWorld());
            }

            this.mainThrusters.forEach((thruster) => {
                thruster.setThrottle(this.mainEngineThrottle);
            });

            // damp other speed
            this.aggregate.body.applyForce(otherSpeed.scale(-10), this.aggregate.body.getObjectCenterWorld());

            if (this.closestWalkableObject !== null) {
                const gravityDir = this.closestWalkableObject.getTransform().getAbsolutePosition().subtract(this.getTransform().getAbsolutePosition()).normalize();
                this.aggregate.body.applyForce(gravityDir.scale(9.8), this.aggregate.body.getObjectCenterWorld());
            }

            this.acceleratingWarpDriveSound.setTargetVolume(0);
            this.deceleratingWarpDriveSound.setTargetVolume(0);

            if (this.targetLandingPad !== null) {
                const shipRelativePosition = this.getTransform().getAbsolutePosition().subtract(this.targetLandingPad.getTransform().getAbsolutePosition());
                const distanceToPad = shipRelativePosition.length();
                const verticalDistance = Vector3.Dot(shipRelativePosition, this.targetLandingPad.getTransform().up);
                if (distanceToPad < 600 && verticalDistance > 0) {
                    if (this.state !== ShipState.LANDING) {
                        createNotification("Automatic landing procedure engaged", 10000);
                    }
                    this.state = ShipState.LANDING;
                    this.landOnPad(this.targetLandingPad);
                }
            }
        } else {
            this.mainThrusters.forEach((thruster) => {
                thruster.setThrottle(0);
            });

            translate(this.getTransform(), warpSpeed.scale(deltaTime));

            this.thrusterSound.setTargetVolume(0);

            if (currentForwardSpeed < this.warpDrive.getWarpSpeed()) {
                this.acceleratingWarpDriveSound.setTargetVolume(1);
                this.deceleratingWarpDriveSound.setTargetVolume(0);
            } else {
                this.deceleratingWarpDriveSound.setTargetVolume(1);
                this.acceleratingWarpDriveSound.setTargetVolume(0);
            }
        }

        this.mainThrusters.forEach((thruster) => {
            thruster.update(deltaTime);
        });

        if (this.state === ShipState.LANDING) {
            this.land(deltaTime);
        }
    }

    public dispose() {
        AudioManager.DisposeSound(this.enableWarpDriveSound);
        AudioManager.DisposeSound(this.disableWarpDriveSound);
        AudioManager.DisposeSound(this.acceleratingWarpDriveSound);
        AudioManager.DisposeSound(this.deceleratingWarpDriveSound);
        AudioManager.DisposeSound(this.thrusterSound);

        this.warpTunnel.dispose();
        this.hyperSpaceTunnel.dispose();
        this.aggregate.dispose();
        this.instanceRoot.dispose();
    }
}
