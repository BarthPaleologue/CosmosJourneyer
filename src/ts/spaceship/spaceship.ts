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
import { getForwardDirection, setRotationQuaternion, translate } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Assets } from "../assets";
import { CollisionMask } from "../settings";
import { Transformable } from "../architecture/transformable";
import { WarpTunnel } from "../utils/warpTunnel";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { HyperSpaceTunnel } from "../utils/hyperSpaceTunnel";
import { AudioInstance } from "../utils/audioInstance";
import { AudioManager } from "../audio/audioManager";
import { MainThruster } from "./mainThruster";
import { AudioMasks } from "../audio/audioMasks";
import { LandingComputer } from "./landingComputer";

export class Spaceship implements Transformable {
    readonly instanceRoot: AbstractMesh;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private readonly warpDrive = new WarpDrive(false);

    private mainEngineThrottle = 0;
    private mainEngineTargetSpeed = 0;

    private closestWalkableObject: Transformable | null = null;

    private closestObject = {
        distance: Infinity,
        radius: 1
    };

    readonly warpTunnel: WarpTunnel;
    readonly hyperSpaceTunnel: HyperSpaceTunnel;

    private readonly scene: Scene;

    readonly landingComputer: LandingComputer;

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
        this.instanceRoot = Assets.CreateWandererInstance();
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

        this.landingComputer = new LandingComputer(this.aggregate.body);
        this.landingComputer.onLandingCompleteObservable.add(() => {
            this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
            this.onLandingObservable.notifyObservers();
        });

        this.warpTunnel = new WarpTunnel(this.getTransform(), scene);
        this.hyperSpaceTunnel = new HyperSpaceTunnel(this.getTransform().getDirection(Axis.Z), scene);
        this.hyperSpaceTunnel.setParent(this.getTransform());
        this.hyperSpaceTunnel.setEnabled(false);

        this.enableWarpDriveSound = new AudioInstance(Assets.ENABLE_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 1, true, this.getTransform());
        this.disableWarpDriveSound = new AudioInstance(Assets.DISABLE_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 1, true, this.getTransform());
        this.acceleratingWarpDriveSound = new AudioInstance(Assets.ACCELERATING_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 0, false, this.getTransform());
        this.deceleratingWarpDriveSound = new AudioInstance(Assets.DECELERATING_WARP_DRIVE_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 0, false, this.getTransform());
        this.hyperSpaceSound = new AudioInstance(Assets.HYPER_SPACE_SOUND, AudioMasks.HYPER_SPACE, 0, false, this.getTransform());
        this.thrusterSound = new AudioInstance(Assets.THRUSTER_SOUND, AudioMasks.STAR_SYSTEM_VIEW, 0, false, this.getTransform());

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

    public engageLanding(landingTarget: Transformable) {
        console.log("Landing sequence engaged");
        this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this.landingComputer.landOnSurface(landingTarget.getTransform());
        this.onLandingEngaged.notifyObservers();
    }

    public isLanded(): boolean {
        return this.aggregate.body.getMotionType() === PhysicsMotionType.STATIC;
    }

    public takeOff() {
        this.landingComputer.takeOff();
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    }

    public update(deltaSeconds: number) {
        this.mainEngineTargetSpeed = Math.sign(this.mainEngineThrottle) * this.mainEngineThrottle ** 2 * 500;

        const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());

        const currentForwardSpeed = Vector3.Dot(warpSpeed, this.aggregate.transformNode.getDirection(Axis.Z));
        this.warpDrive.update(currentForwardSpeed, this.closestObject.distance, this.closestObject.radius, deltaSeconds);

        // the warp throttle goes from 0.1 to 1 smoothly using an inverse function
        if (this.warpDrive.isEnabled()) this.warpTunnel.setThrottle(1 - 1 / (1.1 * (1 + 1e-7 * this.warpDrive.getWarpSpeed())));
        else this.warpTunnel.setThrottle(0);

        if (this.warpDrive.isDisabled()) {
            const linearVelocity = this.aggregate.body.getLinearVelocity();
            const forwardDirection = getForwardDirection(this.getTransform());
            const forwardSpeed = Vector3.Dot(linearVelocity, forwardDirection);

            const otherSpeed = linearVelocity.subtract(forwardDirection.scale(forwardSpeed));

            if (this.mainEngineThrottle !== 0) this.thrusterSound.setTargetVolume(1);
            else this.thrusterSound.setTargetVolume(0);

            if (forwardSpeed < this.mainEngineTargetSpeed) {
                this.aggregate.body.applyForce(forwardDirection.scale(3000), this.aggregate.body.getObjectCenterWorld());
                this.mainThrusters.forEach((thruster) => {
                    thruster.setThrottle(this.mainEngineThrottle);
                });
            } else {
                this.aggregate.body.applyForce(forwardDirection.scale(-3000), this.aggregate.body.getObjectCenterWorld());
            }

            // damp other speed
            this.aggregate.body.applyForce(otherSpeed.scale(-10), this.aggregate.body.getObjectCenterWorld());

            if (this.closestWalkableObject !== null) {
                const gravityDir = this.closestWalkableObject.getTransform().getAbsolutePosition().subtract(this.getTransform().getAbsolutePosition()).normalize();
                this.aggregate.body.applyForce(gravityDir.scale(9.8), this.aggregate.body.getObjectCenterWorld());
            }

            this.acceleratingWarpDriveSound.setTargetVolume(0);
            this.deceleratingWarpDriveSound.setTargetVolume(0);
        } else {
            this.mainThrusters.forEach((thruster) => {
                thruster.setThrottle(0);
            });

            translate(this.getTransform(), warpSpeed.scale(deltaSeconds));

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
            thruster.update(deltaSeconds);
        });

        this.landingComputer.update(deltaSeconds);
    }

    public dispose() {
        AudioManager.DisposeSound(this.enableWarpDriveSound);
        AudioManager.DisposeSound(this.disableWarpDriveSound);
        AudioManager.DisposeSound(this.acceleratingWarpDriveSound);
        AudioManager.DisposeSound(this.deceleratingWarpDriveSound);
        AudioManager.DisposeSound(this.thrusterSound);

        this.landingComputer.dispose();
        this.warpTunnel.dispose();
        this.hyperSpaceTunnel.dispose();
        this.aggregate.dispose();
        this.instanceRoot.dispose();
    }
}
