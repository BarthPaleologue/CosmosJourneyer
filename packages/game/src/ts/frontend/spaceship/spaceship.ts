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

import { Quaternion } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import {
    PhysicsMotionType,
    PhysicsShapeType,
    type IPhysicsCollisionEvent,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { type HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { type Scene } from "@babylonjs/core/scene";

import { type SerializedComponent } from "@/backend/spaceship/serializedComponents/component";
import {
    getDefaultSerializedSpaceship,
    ShipType,
    type SerializedSpaceship,
} from "@/backend/spaceship/serializedSpaceship";

import { HyperSpaceTunnel } from "@/frontend/assets/procedural/hyperSpaceTunnel";
import { WarpTunnel } from "@/frontend/assets/procedural/warpTunnel";
import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { AudioMasks } from "@/frontend/audio/audioMasks";
import { type ISoundInstance } from "@/frontend/audio/soundInstance";
import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { setEnabledBody } from "@/frontend/helpers/havok";
import { translate } from "@/frontend/helpers/transform";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type CelestialBody, type OrbitalObject } from "@/frontend/universe/architecture/orbitalObject";
import { type Transformable } from "@/frontend/universe/architecture/transformable";
import { distanceToAsteroidField } from "@/frontend/universe/asteroidFields/helpers/distance";
import { type ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import type { DeepReadonly } from "@/utils/types";

import { CollisionMask } from "@/settings";

import { canEngageWarpDrive } from "./components/warpDriveUtils";
import { LandingComputer, LandingComputerStatusBit, LandingTargetKind } from "./landingComputer";
import { SpaceshipInternals } from "./spaceshipInternals";
import { Thruster } from "./thruster";

const enum ShipState {
    FLYING,
    LANDING,
    LANDED,
}

export class Spaceship implements Transformable {
    readonly shipType: ShipType;

    readonly id: string;

    readonly name: string;

    readonly instanceRoot: TransformNode;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private landingComputer: LandingComputer | null;

    private mainEngineThrottle = 0;
    private mainEngineTargetSpeed = 0;

    private readonly thrusterForce = 8000;

    readonly maxRollSpeed = 2.0;
    readonly maxYawSpeed = 1.0;
    readonly maxPitchSpeed = 3.0;

    private closestWalkableObject: (Transformable & HasBoundingSphere) | null = null;

    private state = ShipState.FLYING;

    private nearestOrbitalObject: OrbitalObject | null = null;
    private nearestCelestialBody: CelestialBody | null = null;

    readonly warpTunnel: WarpTunnel;
    readonly hyperSpaceTunnel: HyperSpaceTunnel;

    private readonly scene: Scene;

    private targetLandingPad: ILandingPad | null = null;

    private readonly internals: SpaceshipInternals;

    private mainThrusters: Thruster[] = [];

    private isFuelScooping = false;

    readonly enableWarpDriveSound: ISoundInstance;
    readonly disableWarpDriveSound: ISoundInstance;
    readonly acceleratingWarpDriveSound: ISoundInstance;
    readonly deceleratingWarpDriveSound: ISoundInstance;
    readonly hyperSpaceSound: ISoundInstance;
    readonly thrusterSound: ISoundInstance;

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

    private constructor(
        serializedSpaceShip: DeepReadonly<SerializedSpaceship>,
        unfitComponents: Set<SerializedComponent>,
        scene: Scene,
        assets: RenderingAssets,
        soundPlayer: ISoundPlayer,
    ) {
        this.id = serializedSpaceShip.id;

        this.name = serializedSpaceShip.name;

        this.shipType = serializedSpaceShip.type;

        const root = assets.objects.wanderer.instantiateHierarchy(null);
        if (root === null) {
            throw new Error("Wanderer object not found");
        }

        this.instanceRoot = root;
        this.instanceRoot.rotationQuaternion = Quaternion.Identity();

        this.aggregate = new PhysicsAggregate(
            this.instanceRoot,
            PhysicsShapeType.CONTAINER,
            {
                mass: 10,
                restitution: 0.2,
            },
            scene,
        );
        for (const child of this.instanceRoot.getChildMeshes()) {
            if (child.name.includes("mainThruster")) {
                const mainThruster = new Thruster(child, this.instanceRoot.forward.negate(), this.aggregate);
                this.mainThrusters.push(mainThruster);
                continue;
            }
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            childShape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;
            childShape.filterCollideMask = CollisionMask.ENVIRONMENT | CollisionMask.DYNAMIC_OBJECTS;
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;
        this.aggregate.body.setAngularDamping(0.9);

        this.aggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;
        this.aggregate.shape.filterCollideMask = CollisionMask.ENVIRONMENT | CollisionMask.DYNAMIC_OBJECTS;

        this.aggregate.body.setCollisionCallbackEnabled(true);
        this.collisionObservable = this.aggregate.body.getCollisionObservable();

        this.landingComputer = new LandingComputer(this.aggregate, scene.getPhysicsEngine() as PhysicsEngineV2);

        this.warpTunnel = new WarpTunnel(scene);
        this.warpTunnel.getTransform().parent = this.getTransform();

        this.hyperSpaceTunnel = new HyperSpaceTunnel(this.getTransform().forward, scene, assets.textures.noises);
        this.hyperSpaceTunnel.setParent(this.getTransform());
        this.hyperSpaceTunnel.setEnabled(false);

        this.enableWarpDriveSound = soundPlayer.createInstance(
            SoundType.ENABLE_WARP_DRIVE,
            AudioMasks.STAR_MAP_VIEW,
            1,
            true,
        );

        this.disableWarpDriveSound = soundPlayer.createInstance(
            SoundType.DISABLE_WARP_DRIVE,
            AudioMasks.STAR_MAP_VIEW,
            1,
            true,
        );

        this.acceleratingWarpDriveSound = soundPlayer.createInstance(
            SoundType.ACCELERATING_WARP_DRIVE,
            AudioMasks.STAR_SYSTEM_VIEW,
            0,
            false,
        );

        this.deceleratingWarpDriveSound = soundPlayer.createInstance(
            SoundType.DECELERATING_WARP_DRIVE,
            AudioMasks.STAR_SYSTEM_VIEW,
            0,
            false,
        );

        this.hyperSpaceSound = soundPlayer.createInstance(SoundType.HYPER_SPACE, AudioMasks.HYPER_SPACE, 0, false);
        this.thrusterSound = soundPlayer.createInstance(SoundType.THRUSTER, AudioMasks.STAR_SYSTEM_VIEW, 0, false);

        this.internals = new SpaceshipInternals(serializedSpaceShip, unfitComponents);

        const { min: boundingMin, max: boundingMax } = this.getTransform().getHierarchyBoundingVectors();

        this.boundingExtent = boundingMax.subtract(boundingMin);

        this.thrusterSound.play();
        this.acceleratingWarpDriveSound.play();
        this.deceleratingWarpDriveSound.play();
        this.hyperSpaceSound.play();

        this.scene = scene;
    }

    public getInternals() {
        return this.internals;
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

    public enableWarpDrive() {
        const warpDrive = this.getInternals().getWarpDrive();
        if (warpDrive === null) {
            return;
        }

        warpDrive.enable();
        this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);

        this.aggregate.body.setLinearVelocity(Vector3.Zero());
        this.aggregate.body.setAngularVelocity(Vector3.Zero());

        this.thrusterSound.setVolume(0);

        this.enableWarpDriveSound.play();
        this.onWarpDriveEnabled.notifyObservers();
    }

    public disableWarpDrive() {
        const warpDrive = this.getInternals().getWarpDrive();
        if (warpDrive === null) {
            return;
        }

        warpDrive.disengage();
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.disableWarpDriveSound.play();
        this.onWarpDriveDisabled.notifyObservers(false);
    }

    public emergencyStopWarpDrive() {
        const warpDrive = this.getInternals().getWarpDrive();
        if (warpDrive === null) {
            return;
        }

        warpDrive.emergencyStop();
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.disableWarpDriveSound.play();
        this.onWarpDriveDisabled.notifyObservers(true);
    }

    public toggleWarpDrive() {
        const warpDrive = this.getInternals().getWarpDrive();
        if (warpDrive === null) {
            return;
        }

        if (!warpDrive.isEnabled()) this.enableWarpDrive();
        else this.disableWarpDrive();
    }

    public setMainEngineThrottle(throttle: number) {
        this.mainEngineThrottle = throttle;
    }

    /**
     * Returns the speed of the ship in m/s
     * If warp drive is enabled, returns the warp speed
     * If warp drive is disabled, returns the linear velocity of the ship
     * @returns The speed of the ship in m/s
     */
    public getSpeed(): number {
        const warpDrive = this.getInternals().getWarpDrive();

        return warpDrive !== null && warpDrive.isEnabled()
            ? warpDrive.getWarpSpeed()
            : this.aggregate.body.getLinearVelocity().dot(this.getTransform().forward);
    }

    public getThrottle(): number {
        const warpDrive = this.getInternals().getWarpDrive();
        return warpDrive !== null && warpDrive.isEnabled() ? warpDrive.getThrottle() : this.mainEngineThrottle;
    }

    public increaseMainEngineThrottle(delta: number) {
        this.mainEngineThrottle = Math.max(-1, Math.min(1, this.mainEngineThrottle + delta));
    }

    public getClosestWalkableObject(): (Transformable & HasBoundingSphere) | null {
        return this.closestWalkableObject;
    }

    public getNearestOrbitalObject(): OrbitalObject | null {
        return this.nearestOrbitalObject;
    }

    public engageSurfaceLanding(landingTarget: TransformNode) {
        this.state = ShipState.LANDING;
        this.landingComputer?.setTarget({
            kind: LandingTargetKind.CELESTIAL_BODY,
            celestialBody: landingTarget,
        });

        this.onPlanetaryLandingEngaged.notifyObservers();
    }

    public isAutoPiloted() {
        return this.landingComputer?.getTarget() !== null;
    }

    public engageLandingOnPad(landingPad: ILandingPad) {
        this.targetLandingPad = landingPad;
    }

    public getTargetLandingPad(): ILandingPad | null {
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

        this.landingComputer?.setTarget(null);

        this.targetLandingPad = null;

        this.onLandingCancelled.notifyObservers();
    }

    public spawnOnPad(landingPad: ILandingPad) {
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

        translate(this.getTransform(), this.getTransform().up.scale(5));

        this.state = ShipState.FLYING;
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS | CollisionMask.ENVIRONMENT;
        this.aggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;

        this.aggregate.body.applyImpulse(this.getTransform().up.scale(200), this.getTransform().getAbsolutePosition());

        this.onTakeOff.notifyObservers();
    }

    private handleFuelScoop(deltaSeconds: number) {
        const fuelScoop = this.getInternals().getFuelScoop();
        if (fuelScoop === null) return;
        if (this.nearestCelestialBody === null) return;
        if (!["star", "gasPlanet"].includes(this.nearestCelestialBody.model.type)) return;

        const distanceToBody = Vector3.Distance(
            this.getTransform().getAbsolutePosition(),
            this.nearestCelestialBody.getTransform().getAbsolutePosition(),
        );
        const currentFuelPercentage = this.getRemainingFuel() / this.getTotalFuelCapacity();
        if (
            Math.abs(currentFuelPercentage - 1) < 0.01 ||
            distanceToBody > this.nearestCelestialBody.getBoundingRadius() * 2.3
        ) {
            if (this.isFuelScooping) {
                this.isFuelScooping = false;
                this.onFuelScoopEnd.notifyObservers();
            }

            return;
        }

        if (distanceToBody > this.nearestCelestialBody.getBoundingRadius() * 2.0) {
            return;
        }

        if (!this.isFuelScooping) {
            this.isFuelScooping = true;
            this.onFuelScoopStart.notifyObservers();
        }

        let fuelAvailability: number;
        switch (this.nearestCelestialBody.model.type) {
            case "star":
                fuelAvailability = 1;
                break;
            case "gasPlanet":
                fuelAvailability = 0.3;
                break;
            case "neutronStar":
            case "blackHole":
            case "telluricPlanet":
            case "telluricSatellite":
            case "mandelbulb":
            case "juliaSet":
            case "mandelbox":
            case "sierpinskiPyramid":
            case "mengerSponge":
            case "darkKnight":
                fuelAvailability = 0;
        }

        this.refuel(fuelScoop.fuelPerSecond * fuelAvailability * deltaSeconds);
    }

    private updateWarpDrive(deltaSeconds: number) {
        const warpDrive = this.getInternals().getWarpDrive();
        if (warpDrive === null) {
            return;
        }

        const warpSpeed = this.aggregate.transformNode.forward.scale(warpDrive.getWarpSpeed());
        this.warpTunnel.update(deltaSeconds);

        const currentForwardSpeed = Vector3.Dot(warpSpeed, this.aggregate.transformNode.forward);

        let closestDistance = Number.POSITIVE_INFINITY;
        let objectHalfThickness = 0;

        if (warpDrive.isEnabled()) {
            if (this.nearestOrbitalObject !== null) {
                if (!canEngageWarpDrive(this.getTransform(), this.getSpeed(), this.nearestOrbitalObject)) {
                    this.emergencyStopWarpDrive();
                }

                const distanceToClosestOrbitalObject = Vector3.Distance(
                    this.getTransform().getAbsolutePosition(),
                    this.nearestOrbitalObject.getTransform().getAbsolutePosition(),
                );
                const orbitalObjectRadius = this.nearestOrbitalObject.getBoundingRadius();

                closestDistance = Math.min(closestDistance, distanceToClosestOrbitalObject);
                objectHalfThickness = Math.max(orbitalObjectRadius, objectHalfThickness);
            }

            if (this.nearestCelestialBody !== null) {
                // if the spaceship goes too close to planetary rings, stop the warp drive to avoid collision with asteroids
                const asteroidField = this.nearestCelestialBody.asteroidField;

                if (asteroidField !== null) {
                    const distanceToRings = distanceToAsteroidField(
                        this.getTransform().getAbsolutePosition(),
                        asteroidField,
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

            this.thrusterSound.setVolume(0);

            if (currentForwardSpeed < warpDrive.getWarpSpeed()) {
                this.acceleratingWarpDriveSound.setVolume(1);
                this.deceleratingWarpDriveSound.setVolume(0);
            } else {
                this.deceleratingWarpDriveSound.setVolume(1);
                this.acceleratingWarpDriveSound.setVolume(0);
            }
        }

        warpDrive.update(closestDistance, objectHalfThickness, deltaSeconds);

        // the warp throttle goes from 0.1 to 1 smoothly using an inverse function
        if (warpDrive.isEnabled()) this.warpTunnel.setThrottle(1 - 1 / (1.1 * (1 + 1e-7 * warpDrive.getWarpSpeed())));
        else this.warpTunnel.setThrottle(0);
    }

    public update(deltaSeconds: number) {
        const thrusters = this.getInternals().getThrusters();
        this.mainEngineTargetSpeed = this.mainEngineThrottle * (thrusters?.maxSpeed ?? 0);
        if (this.targetLandingPad !== null) {
            this.mainEngineTargetSpeed /= 8;
        }

        this.updateWarpDrive(deltaSeconds);

        this.handleFuelScoop(deltaSeconds);

        const warpDrive = this.getInternals().getWarpDrive();

        if ((warpDrive === null || warpDrive.isDisabled()) && this.state !== ShipState.LANDED) {
            const linearVelocity = this.aggregate.body.getLinearVelocity();
            const forwardDirection = this.getTransform().getDirection(Vector3.Forward(this.scene.useRightHandedSystem));
            const forwardSpeed = Vector3.Dot(linearVelocity, forwardDirection);

            if (this.mainEngineThrottle !== 0) {
                const throttleVolume = Math.abs(this.mainEngineThrottle); // Ensure volume is positive
                this.thrusterSound.setVolume(throttleVolume);
            } else {
                this.thrusterSound.setVolume(0);
            }

            if (!this.isAutoPiloted()) {
                const speedDifference = forwardSpeed - this.mainEngineTargetSpeed;
                if (Math.abs(speedDifference) > 2) {
                    if (speedDifference < 0) {
                        this.aggregate.body.applyForce(
                            forwardDirection.scale(this.thrusterForce),
                            this.aggregate.body.getObjectCenterWorld(),
                        );
                    } else {
                        this.aggregate.body.applyForce(
                            forwardDirection.scale(-0.7 * this.thrusterForce),
                            this.aggregate.body.getObjectCenterWorld(),
                        );
                    }
                }

                // damp other speed
                const otherSpeed = linearVelocity.subtract(forwardDirection.scale(forwardSpeed));
                this.aggregate.body.applyForce(otherSpeed.scale(-5), this.aggregate.body.getObjectCenterWorld());
            }

            this.mainThrusters.forEach((thruster) => {
                thruster.setThrottle(this.mainEngineThrottle);
            });

            this.acceleratingWarpDriveSound.setVolume(0);
            this.deceleratingWarpDriveSound.setVolume(0);

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
                            landingPad: this.targetLandingPad,
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

        if (this.landingComputer !== null) {
            const landingComputerStatus = this.landingComputer.update(deltaSeconds);
            switch (landingComputerStatus) {
                case LandingComputerStatusBit.PROGRESS:
                    break;
                case LandingComputerStatusBit.COMPLETE:
                    this.completeLanding();
                    break;
                case LandingComputerStatusBit.TIMEOUT:
                    this.cancelLanding();
                    break;
                case LandingComputerStatusBit.IDLE:
                    break;
                case LandingComputerStatusBit.NO_LANDING_SPOT:
                    this.cancelLanding();
            }
        }

        if (this.isAutoPiloted()) {
            this.setMainEngineThrottle(0);
        }

        const fuelToBurn =
            warpDrive !== null && warpDrive.isEnabled()
                ? deltaSeconds * warpDrive.getFuelConsumptionRate(this.getSpeed())
                : deltaSeconds * this.mainEngineThrottle * 0.02;
        if (fuelToBurn < this.getRemainingFuel()) {
            this.burnFuel(fuelToBurn);
        } else {
            this.emergencyStopWarpDrive();
            this.mainEngineThrottle = 0;
        }
    }

    public getTotalFuelCapacity(): number {
        return this.getInternals()
            .getFuelTanks()
            .reduce((acc, tank) => acc + tank.getMaxFuel(), 0);
    }

    public getRemainingFuel(): number {
        return this.getInternals()
            .getFuelTanks()
            .reduce((acc, tank) => acc + tank.getCurrentFuel(), 0);
    }

    public burnFuel(amount: number): number {
        if (amount > this.getRemainingFuel()) {
            throw new Error("Not enough fuel in the tanks.");
        }

        let fuelLeftToBurn = amount;
        for (const tank of this.getInternals().getFuelTanks()) {
            const tankRemainingBefore = tank.getCurrentFuel();
            tank.burnFuel(Math.min(fuelLeftToBurn, tankRemainingBefore));
            const tankRemainingAfter = tank.getCurrentFuel();
            fuelLeftToBurn -= tankRemainingBefore - tankRemainingAfter;
        }

        return amount - fuelLeftToBurn;
    }

    public refuel(amount: number): number {
        let fuelLeftToRefuel = amount;
        for (const tank of this.getInternals().getFuelTanks()) {
            const tankRemainingBefore = tank.getCurrentFuel();
            tank.fill(Math.min(fuelLeftToRefuel, tank.getMaxFuel() - tankRemainingBefore));
            const tankRemainingAfter = tank.getCurrentFuel();
            fuelLeftToRefuel -= tankRemainingAfter - tankRemainingBefore;
        }

        return amount - fuelLeftToRefuel;
    }

    public static CreateDefault(scene: Scene, assets: RenderingAssets, soundPlayer: ISoundPlayer): Spaceship {
        return Spaceship.Deserialize(getDefaultSerializedSpaceship(), new Set(), scene, assets, soundPlayer);
    }

    public static Deserialize(
        serializedSpaceship: DeepReadonly<SerializedSpaceship>,
        unfitComponents: Set<SerializedComponent>,
        scene: Scene,
        assets: RenderingAssets,
        soundPlayer: ISoundPlayer,
    ): Spaceship {
        return new Spaceship(serializedSpaceship, unfitComponents, scene, assets, soundPlayer);
    }

    public serialize(): SerializedSpaceship {
        switch (this.shipType) {
            case ShipType.WANDERER:
                return {
                    id: this.id,
                    name: this.name,
                    type: this.shipType,
                    components: this.getInternals().serialize(),
                };
        }
    }

    public dispose(soundPlayer: ISoundPlayer) {
        soundPlayer.freeInstance(this.enableWarpDriveSound);
        soundPlayer.freeInstance(this.disableWarpDriveSound);
        soundPlayer.freeInstance(this.acceleratingWarpDriveSound);
        soundPlayer.freeInstance(this.deceleratingWarpDriveSound);
        soundPlayer.freeInstance(this.thrusterSound);

        this.mainThrusters.forEach((thruster) => {
            thruster.dispose();
        });
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
