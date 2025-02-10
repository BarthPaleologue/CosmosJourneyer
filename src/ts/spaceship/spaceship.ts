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
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { WarpDrive } from "./warpDrive";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import {
    IPhysicsCollisionEvent,
    PhysicsMotionType,
    PhysicsShapeType
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { getForwardDirection, translate } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { CollisionMask, Settings } from "../settings";
import { Transformable } from "../architecture/transformable";
import { WarpTunnel } from "../utils/warpTunnel";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { HyperSpaceTunnel } from "../utils/hyperSpaceTunnel";
import { AudioInstance } from "../utils/audioInstance";
import { AudioManager } from "../audio/audioManager";
import { Thruster } from "./thruster";
import { AudioMasks } from "../audio/audioMasks";
import { Objects } from "../assets/objects";
import { Sounds } from "../assets/sounds";
import { LandingPad } from "../assets/procedural/landingPad/landingPad";
import { createNotification, NotificationIntent, NotificationOrigin } from "../utils/notification";
import { CelestialBody, OrbitalObject } from "../architecture/orbitalObject";
import { HasBoundingSphere } from "../architecture/hasBoundingSphere";
import { FuelTank, SerializedFuelTank } from "./fuelTank";
import { FuelScoop } from "./fuelScoop";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { LandingComputer, LandingTargetKind } from "./landingComputer";

const enum ShipState {
    FLYING,
    LANDING,
    LANDED
}

export const enum ShipType {
    WANDERER
}

export type SerializedSpaceship = {
    id: string;
    name: string;
    type: ShipType;
    fuelTanks: SerializedFuelTank[];
    fuelScoop: FuelScoop | null;
};

export const DefaultSerializedSpaceship: SerializedSpaceship = {
    id: crypto.randomUUID(),
    name: "Wanderer",
    type: ShipType.WANDERER,
    fuelTanks: [{ currentFuel: 100, maxFuel: 100 }],
    fuelScoop: {
        fuelPerSecond: 2.5
    }
};

export class Spaceship implements Transformable {
    readonly id: string;

    readonly name: string;

    readonly instanceRoot: AbstractMesh;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private landingComputer: LandingComputer | null;

    private readonly warpDrive = new WarpDrive(false);

    private mainEngineThrottle = 0;
    private mainEngineTargetSpeed = 0;

    private readonly thrusterForce = 8000;

    readonly maxRollSpeed = 2.0;
    readonly maxYawSpeed = 1.0;
    readonly maxPitchSpeed = 3.0;

    /**
     * Maximum speed of the ship in m/s
     * @private
     */
    private readonly maxSpeed = 1400;

    private closestWalkableObject: (Transformable & HasBoundingSphere) | null = null;

    private state = ShipState.FLYING;

    private nearestOrbitalObject: OrbitalObject | null = null;
    private nearestCelestialBody: CelestialBody | null = null;

    readonly warpTunnel: WarpTunnel;
    readonly hyperSpaceTunnel: HyperSpaceTunnel;

    private readonly scene: Scene;

    private targetLandingPad: LandingPad | null = null;

    private mainThrusters: Thruster[] = [];

    readonly fuelTanks: FuelTank[];

    readonly fuelScoop: FuelScoop | null;
    private isFuelScooping = false;

    readonly enableWarpDriveSound: AudioInstance;
    readonly disableWarpDriveSound: AudioInstance;
    readonly acceleratingWarpDriveSound: AudioInstance;
    readonly deceleratingWarpDriveSound: AudioInstance;
    readonly hyperSpaceSound: AudioInstance;
    readonly thrusterSound: AudioInstance;

    readonly onFuelScoopStart = new Observable<void>();
    readonly onFuelScoopEnd = new Observable<void>();

    readonly onWarpDriveEnabled = new Observable<void>();
    readonly onWarpDriveDisabled = new Observable<boolean>();

    readonly onPlanetaryLandingEngaged = new Observable<void>();
    readonly onLandingObservable = new Observable<void>();
    readonly onLandingCancelled = new Observable<void>();

    readonly onTakeOff = new Observable<void>();

    readonly onAutoPilotEngaged = new Observable<void>();

    readonly boundingExtent: Vector3;

    private constructor(serializedSpaceShip: SerializedSpaceship, scene: Scene) {
        this.id = serializedSpaceShip.id ?? crypto.randomUUID();

        this.name = serializedSpaceShip.name;

        this.instanceRoot = Objects.CreateWandererInstance();
        this.instanceRoot.rotationQuaternion = Quaternion.Identity();

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
                const mainThruster = new Thruster(
                    child,
                    getForwardDirection(this.instanceRoot).negate(),
                    this.aggregate
                );
                this.mainThrusters.push(mainThruster);
                continue;
            }
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;
        this.aggregate.body.setAngularDamping(0.9);

        this.aggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;
        this.aggregate.shape.filterCollideMask = CollisionMask.ENVIRONMENT | CollisionMask.DYNAMIC_OBJECTS;

        this.aggregate.body.setCollisionCallbackEnabled(true);
        this.collisionObservable = this.aggregate.body.getCollisionObservable();

        this.landingComputer = new LandingComputer(this.aggregate, scene.getPhysicsEngine() as PhysicsEngineV2);
        this.landingComputer.onLandingComplete.add(() => {
            this.completeLanding();
        });

        this.warpTunnel = new WarpTunnel(this.getTransform(), scene);
        this.hyperSpaceTunnel = new HyperSpaceTunnel(this.getTransform().getDirection(Axis.Z), scene);
        this.hyperSpaceTunnel.setParent(this.getTransform());
        this.hyperSpaceTunnel.setEnabled(false);

        this.enableWarpDriveSound = new AudioInstance(
            Sounds.ENABLE_WARP_DRIVE_SOUND,
            AudioMasks.STAR_SYSTEM_VIEW,
            1,
            true,
            this.getTransform()
        );
        this.disableWarpDriveSound = new AudioInstance(
            Sounds.DISABLE_WARP_DRIVE_SOUND,
            AudioMasks.STAR_SYSTEM_VIEW,
            1,
            true,
            this.getTransform()
        );
        this.acceleratingWarpDriveSound = new AudioInstance(
            Sounds.ACCELERATING_WARP_DRIVE_SOUND,
            AudioMasks.STAR_SYSTEM_VIEW,
            0,
            false,
            this.getTransform()
        );
        this.deceleratingWarpDriveSound = new AudioInstance(
            Sounds.DECELERATING_WARP_DRIVE_SOUND,
            AudioMasks.STAR_SYSTEM_VIEW,
            0,
            false,
            this.getTransform()
        );
        this.hyperSpaceSound = new AudioInstance(
            Sounds.HYPER_SPACE_SOUND,
            AudioMasks.HYPER_SPACE,
            0,
            false,
            this.getTransform()
        );
        this.thrusterSound = new AudioInstance(
            Sounds.THRUSTER_SOUND,
            AudioMasks.STAR_SYSTEM_VIEW,
            0,
            false,
            this.getTransform()
        );

        this.fuelTanks = serializedSpaceShip.fuelTanks.map((tank) => FuelTank.Deserialize(tank));

        this.fuelScoop = serializedSpaceShip.fuelScoop;

        const { min: boundingMin, max: boundingMax } = this.getTransform().getHierarchyBoundingVectors();

        this.boundingExtent = boundingMax.subtract(boundingMin);

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

    public setClosestWalkableObject(object: Transformable & HasBoundingSphere) {
        this.closestWalkableObject = object;
    }

    public getTransform(): TransformNode {
        return this.aggregate.transformNode;
    }

    public setEnabled(enabled: boolean, havokPlugin: HavokPlugin) {
        this.instanceRoot.setEnabled(enabled);
        setEnabledBody(this.aggregate.body, enabled, havokPlugin);
    }

    public setNearestOrbitalObject(orbitalObject: OrbitalObject) {
        this.nearestOrbitalObject = orbitalObject;
    }

    public setNearestCelestialBody(celestialBody: CelestialBody) {
        this.nearestCelestialBody = celestialBody;
    }

    public isWarpDriveEnabled() {
        return this.warpDrive.isEnabled();
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
        this.warpDrive.disengage();
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.disableWarpDriveSound.sound.play();
        this.onWarpDriveDisabled.notifyObservers(false);
    }

    public emergencyStopWarpDrive() {
        this.warpDrive.emergencyStop();
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.disableWarpDriveSound.sound.play();
        this.onWarpDriveDisabled.notifyObservers(true);
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
        return this.warpDrive.isEnabled()
            ? this.warpDrive.getWarpSpeed()
            : this.aggregate.body.getLinearVelocity().dot(getForwardDirection(this.getTransform()));
    }

    public getThrottle(): number {
        return this.warpDrive.isEnabled() ? this.warpDrive.getThrottle() : this.mainEngineThrottle;
    }

    public increaseMainEngineThrottle(delta: number) {
        this.mainEngineThrottle = Math.max(-1, Math.min(1, this.mainEngineThrottle + delta));
    }

    public getClosestWalkableObject(): (Transformable & HasBoundingSphere) | null {
        return this.closestWalkableObject;
    }

    public engagePlanetaryLanding(landingTarget: Transformable) {
        this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this.state = ShipState.LANDING;
        this.landingComputer?.setTarget({
            kind: LandingTargetKind.CELESTIAL_BODY,
            celestialBody: landingTarget
        });

        this.onPlanetaryLandingEngaged.notifyObservers();
    }

    public engageLandingOnPad(landingPad: LandingPad) {
        this.targetLandingPad = landingPad;
    }

    public getTargetLandingPad(): LandingPad | null {
        return this.targetLandingPad;
    }

    private completeLanding() {
        this.state = ShipState.LANDED;

        this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
        this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
        this.aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;

        if (this.targetLandingPad !== null) {
            this.getTransform().setParent(this.targetLandingPad.getTransform());
        }

        this.landingComputer?.setTarget(null);

        this.onLandingObservable.notifyObservers();
    }

    public cancelLanding() {
        this.state = ShipState.FLYING;

        this.getTransform().setParent(null);

        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS | CollisionMask.ENVIRONMENT;
        this.aggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;

        this.onLandingCancelled.notifyObservers();
    }

    public spawnOnPad(landingPad: LandingPad) {
        this.getTransform().setParent(null);
        this.engageLandingOnPad(landingPad);
        this.getTransform().rotationQuaternion = Quaternion.Identity();
        this.getTransform().position.copyFromFloats(0, this.boundingExtent.y / 2, 0);
        this.getTransform().parent = landingPad.getTransform();
        this.completeLanding();
    }

    public isLanded(): boolean {
        return this.state === ShipState.LANDED;
    }

    public isLanding(): boolean {
        return this.state === ShipState.LANDING;
    }

    public isLandedAtFacility(): boolean {
        return this.isLanded() && this.targetLandingPad !== null;
    }

    public takeOff() {
        this.targetLandingPad = null;

        this.getTransform().setParent(null);

        this.state = ShipState.FLYING;
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS | CollisionMask.ENVIRONMENT;
        this.aggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;

        this.aggregate.body.applyImpulse(this.getTransform().up.scale(200), this.getTransform().getAbsolutePosition());

        this.onTakeOff.notifyObservers();
    }

    public canEngageWarpDrive() {
        if (this.nearestOrbitalObject !== null) {
            const distanceToObject = Vector3.Distance(
                this.getTransform().getAbsolutePosition(),
                this.nearestOrbitalObject.getTransform().getAbsolutePosition()
            );
            if (distanceToObject < this.nearestOrbitalObject.getBoundingRadius() * 1.03) {
                return false;
            }
        }

        if (this.nearestCelestialBody !== null) {
            // if the spaceship goes too close to planetary rings, stop the warp drive to avoid collision with asteroids
            const asteroidField = this.nearestCelestialBody.asteroidField;

            if (asteroidField !== null) {
                const inverseWorld = this.nearestCelestialBody.getTransform().getWorldMatrix().clone().invert();
                const relativePosition = Vector3.TransformCoordinates(
                    this.getTransform().getAbsolutePosition(),
                    inverseWorld
                );
                const relativeForward = Vector3.TransformNormal(getForwardDirection(this.getTransform()), inverseWorld);
                const distanceAboveRings = relativePosition.y;
                const planarDistance = Math.sqrt(
                    relativePosition.x * relativePosition.x + relativePosition.z * relativePosition.z
                );

                const nbSecondsPrediction = 0.5;
                const nextRelativePosition = relativePosition.add(
                    relativeForward.scale(this.getSpeed() * nbSecondsPrediction)
                );
                const nextDistanceAboveRings = nextRelativePosition.y;
                const nextPlanarDistance = Math.sqrt(
                    nextRelativePosition.x * nextRelativePosition.x + nextRelativePosition.z * nextRelativePosition.z
                );

                const ringsMinDistance = asteroidField.minRadius;
                const ringsMaxDistance = asteroidField.maxRadius;

                const isAboveRing = planarDistance > ringsMinDistance && planarDistance < ringsMaxDistance;
                const willBeAboveRing = nextPlanarDistance > ringsMinDistance && nextPlanarDistance < ringsMaxDistance;

                const isInRing = Math.abs(distanceAboveRings) < asteroidField.patchThickness / 2 && isAboveRing;
                const willCrossRing =
                    Math.sign(distanceAboveRings) !== Math.sign(nextDistanceAboveRings) &&
                    (willBeAboveRing || isAboveRing);

                if (isInRing || willCrossRing) {
                    return false;
                }
            }
        }

        return true;
    }

    private handleFuelScoop(deltaSeconds: number) {
        if (this.fuelScoop === null) return;
        if (this.nearestCelestialBody === null) return;
        if (![OrbitalObjectType.STAR, OrbitalObjectType.GAS_PLANET].includes(this.nearestCelestialBody.model.type))
            return;

        const distanceToBody = Vector3.Distance(
            this.getTransform().getAbsolutePosition(),
            this.nearestCelestialBody.getTransform().getAbsolutePosition()
        );
        const currentFuelPercentage = this.getRemainingFuel() / this.getTotalFuelCapacity();
        if (
            Math.abs(currentFuelPercentage - 1) < 0.01 ||
            distanceToBody > this.nearestCelestialBody.getBoundingRadius() * 1.7
        ) {
            if (this.isFuelScooping) {
                this.isFuelScooping = false;
                this.onFuelScoopEnd.notifyObservers();
            }

            return;
        }

        if (!this.isFuelScooping) {
            this.isFuelScooping = true;
            this.onFuelScoopStart.notifyObservers();
        }

        let fuelAvailability;
        switch (this.nearestCelestialBody.model.type) {
            case OrbitalObjectType.STAR:
                fuelAvailability = 1;
                break;
            case OrbitalObjectType.GAS_PLANET:
                fuelAvailability = 0.3;
                break;
            case OrbitalObjectType.NEUTRON_STAR:
            case OrbitalObjectType.BLACK_HOLE:
            case OrbitalObjectType.TELLURIC_PLANET:
            case OrbitalObjectType.TELLURIC_SATELLITE:
            case OrbitalObjectType.MANDELBULB:
            case OrbitalObjectType.JULIA_SET:
            case OrbitalObjectType.MANDELBOX:
            case OrbitalObjectType.SIERPINSKI_PYRAMID:
            case OrbitalObjectType.MENGER_SPONGE:
                fuelAvailability = 0;
        }

        this.refuel(this.fuelScoop.fuelPerSecond * fuelAvailability * deltaSeconds);
    }

    private updateWarpDrive(deltaSeconds: number) {
        const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());
        this.warpTunnel.update(deltaSeconds);

        const currentForwardSpeed = Vector3.Dot(
            warpSpeed,
            this.aggregate.transformNode.getDirection(Vector3.Forward(this.scene.useRightHandedSystem))
        );

        let closestDistance = Number.POSITIVE_INFINITY;
        let objectHalfThickness = 0;

        if (this.warpDrive.isEnabled()) {
            if (!this.canEngageWarpDrive()) {
                this.emergencyStopWarpDrive();
            }

            if (this.nearestOrbitalObject !== null) {
                const distanceToClosestOrbitalObject = Vector3.Distance(
                    this.getTransform().getAbsolutePosition(),
                    this.nearestOrbitalObject.getTransform().getAbsolutePosition()
                );
                const orbitalObjectRadius = this.nearestOrbitalObject.getBoundingRadius();

                closestDistance = Math.min(closestDistance, distanceToClosestOrbitalObject);
                objectHalfThickness = Math.max(orbitalObjectRadius, objectHalfThickness);
            }

            if (this.nearestCelestialBody !== null) {
                // if the spaceship goes too close to planetary rings, stop the warp drive to avoid collision with asteroids
                const asteroidField = this.nearestCelestialBody.asteroidField;

                if (asteroidField !== null) {
                    const relativePosition = this.getTransform()
                        .getAbsolutePosition()
                        .subtract(this.nearestCelestialBody.getTransform().getAbsolutePosition());
                    const distanceAboveRings = Math.abs(
                        Vector3.Dot(relativePosition, this.nearestCelestialBody.getTransform().up)
                    );
                    const planarDistance = relativePosition
                        .subtract(this.nearestCelestialBody.getTransform().up.scale(distanceAboveRings))
                        .length();

                    const ringsMinDistance = asteroidField.minRadius;
                    const ringsMaxDistance = asteroidField.maxRadius;

                    const isAboveRings = planarDistance > ringsMinDistance && planarDistance < ringsMaxDistance;

                    const distanceToRings = isAboveRings
                        ? Math.abs(distanceAboveRings)
                        : Math.sqrt(
                              Math.min(
                                  (planarDistance - ringsMinDistance) ** 2,
                                  (planarDistance - ringsMaxDistance) ** 2
                              ) +
                                  distanceAboveRings ** 2
                          );

                    if (distanceToRings < closestDistance) {
                        closestDistance = distanceToRings;
                        objectHalfThickness = asteroidField.patchThickness / 2;
                    }
                }
            }

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

        this.warpDrive.update(currentForwardSpeed, closestDistance, objectHalfThickness, deltaSeconds);

        // the warp throttle goes from 0.1 to 1 smoothly using an inverse function
        if (this.warpDrive.isEnabled())
            this.warpTunnel.setThrottle(1 - 1 / (1.1 * (1 + 1e-7 * this.warpDrive.getWarpSpeed())));
        else this.warpTunnel.setThrottle(0);
    }

    public update(deltaSeconds: number) {
        this.mainEngineTargetSpeed = this.mainEngineThrottle * this.maxSpeed;

        this.updateWarpDrive(deltaSeconds);

        this.handleFuelScoop(deltaSeconds);

        if (this.warpDrive.isDisabled() && this.state !== ShipState.LANDED) {
            const linearVelocity = this.aggregate.body.getLinearVelocity();
            const forwardDirection = getForwardDirection(this.getTransform());
            const forwardSpeed = Vector3.Dot(linearVelocity, forwardDirection);

            if (this.mainEngineThrottle !== 0) this.thrusterSound.setTargetVolume(1);
            else this.thrusterSound.setTargetVolume(0);

            if (this.landingComputer?.getTarget() === null) {
                const speedDifference = forwardSpeed - this.mainEngineTargetSpeed;
                if (Math.abs(speedDifference) > 2) {
                    if (speedDifference < 0) {
                        this.aggregate.body.applyForce(
                            forwardDirection.scale(this.thrusterForce),
                            this.aggregate.body.getObjectCenterWorld()
                        );
                    } else {
                        this.aggregate.body.applyForce(
                            forwardDirection.scale(-0.7 * this.thrusterForce),
                            this.aggregate.body.getObjectCenterWorld()
                        );
                    }
                }

                // damp other speed
                const otherSpeed = linearVelocity.subtract(forwardDirection.scale(forwardSpeed));
                this.aggregate.body.applyForce(otherSpeed.scale(-10), this.aggregate.body.getObjectCenterWorld());
            }

            this.mainThrusters.forEach((thruster) => {
                thruster.setThrottle(this.mainEngineThrottle);
            });

            this.acceleratingWarpDriveSound.setTargetVolume(0);
            this.deceleratingWarpDriveSound.setTargetVolume(0);

            if (this.targetLandingPad !== null && this.landingComputer !== null) {
                const shipRelativePosition = this.getTransform()
                    .getAbsolutePosition()
                    .subtract(this.targetLandingPad.getTransform().getAbsolutePosition());
                const distanceToPad = shipRelativePosition.length();
                const verticalDistance = Vector3.Dot(shipRelativePosition, this.targetLandingPad.getTransform().up);
                if (distanceToPad < 600 && verticalDistance > 0) {
                    if (this.state !== ShipState.LANDING) {
                        this.landingComputer.setTarget({
                            kind: LandingTargetKind.LANDING_PAD,
                            landingPad: this.targetLandingPad
                        });

                        this.state = ShipState.LANDING;

                        this.onAutoPilotEngaged.notifyObservers();
                    }
                }
            }
        }

        this.mainThrusters.forEach((thruster) => {
            thruster.update(deltaSeconds);
        });

        this.landingComputer?.update();

        const distanceTravelledLY = (this.getSpeed() * deltaSeconds) / Settings.LIGHT_YEAR;
        const fuelToBurn = this.warpDrive.getFuelConsumption(distanceTravelledLY);
        if (fuelToBurn < this.getRemainingFuel()) {
            this.burnFuel(fuelToBurn);
        } else {
            this.emergencyStopWarpDrive();
            this.mainEngineThrottle = 0;
        }
    }

    public getTotalFuelCapacity(): number {
        return this.fuelTanks.reduce((acc, tank) => acc + tank.getMaxFuel(), 0);
    }

    public getRemainingFuel(): number {
        return this.fuelTanks.reduce((acc, tank) => acc + tank.getCurrentFuel(), 0);
    }

    public burnFuel(amount: number): number {
        if (amount > this.getRemainingFuel()) {
            throw new Error("Not enough fuel in the tanks.");
        }

        let fuelLeftToBurn = amount;
        for (const tank of this.fuelTanks) {
            const tankRemainingBefore = tank.getCurrentFuel();
            tank.burnFuel(Math.min(fuelLeftToBurn, tankRemainingBefore));
            const tankRemainingAfter = tank.getCurrentFuel();
            fuelLeftToBurn -= tankRemainingBefore - tankRemainingAfter;
        }

        return amount - fuelLeftToBurn;
    }

    public refuel(amount: number): number {
        let fuelLeftToRefuel = amount;
        for (const tank of this.fuelTanks) {
            const tankRemainingBefore = tank.getCurrentFuel();
            tank.fill(Math.min(fuelLeftToRefuel, tank.getMaxFuel() - tankRemainingBefore));
            const tankRemainingAfter = tank.getCurrentFuel();
            fuelLeftToRefuel -= tankRemainingAfter - tankRemainingBefore;
        }

        return amount - fuelLeftToRefuel;
    }

    public static CreateDefault(scene: Scene): Spaceship {
        return Spaceship.Deserialize(DefaultSerializedSpaceship, scene);
    }

    public static Deserialize(serializedSpaceship: SerializedSpaceship, scene: Scene): Spaceship {
        return new Spaceship(serializedSpaceship, scene);
    }

    public serialize(): SerializedSpaceship {
        return {
            id: this.id,
            name: this.name,
            type: ShipType.WANDERER,
            fuelTanks: this.fuelTanks.map((tank) => tank.serialize()),
            fuelScoop: this.fuelScoop
        };
    }

    public dispose() {
        AudioManager.DisposeSound(this.enableWarpDriveSound);
        AudioManager.DisposeSound(this.disableWarpDriveSound);
        AudioManager.DisposeSound(this.acceleratingWarpDriveSound);
        AudioManager.DisposeSound(this.deceleratingWarpDriveSound);
        AudioManager.DisposeSound(this.thrusterSound);

        this.mainThrusters.forEach((thruster) => thruster.dispose());
        this.mainThrusters.length = 0;

        this.warpTunnel.dispose();
        this.hyperSpaceTunnel.dispose();
        this.aggregate.dispose();
        this.instanceRoot.dispose();

        this.onWarpDriveEnabled.clear();
        this.onWarpDriveDisabled.clear();

        this.onFuelScoopStart.clear();
        this.onFuelScoopEnd.clear();

        this.onPlanetaryLandingEngaged.clear();
        this.onLandingObservable.clear();
    }
}
