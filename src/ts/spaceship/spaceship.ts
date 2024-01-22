import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MainThruster } from "./mainThruster";
import { WarpDrive } from "./warpDrive";
import { RCSThruster } from "./rcsThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { getForwardDirection, getUpwardDirection, rotate, translate } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Assets } from "../assets";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { CollisionMask } from "../settings";
import { Transformable } from "../architecture/transformable";
import { WarpTunnel } from "../utils/warpTunnel";

enum ShipState {
    FLYING,
    LANDING,
    LANDED
}

export class Spaceship implements Transformable {
    readonly instanceRoot: AbstractMesh;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private flightAssistEnabled = true;

    readonly mainThrusters: MainThruster[] = [];
    readonly rcsThrusters: RCSThruster[] = [];

    private readonly warpDrive = new WarpDrive(false);

    private closestWalkableObject: Transformable | null = null;

    private landingTarget: Transformable | null = null;
    private readonly raycastResult = new PhysicsRaycastResult();

    private state = ShipState.FLYING;

    private closestObject = {
        distance: Infinity,
        radius: 1
    };

    private readonly warpTunnel: WarpTunnel;

    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.instanceRoot = Assets.CreateSpaceShipInstance();

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
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            childShape.filterMembershipMask = CollisionMask.SPACESHIP;
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;

        this.aggregate.body.setCollisionCallbackEnabled(true);

        this.collisionObservable = this.aggregate.body.getCollisionObservable();
        this.collisionObservable.add((collisionEvent: IPhysicsCollisionEvent) => {
            console.log("Collision");
            if (collisionEvent.impulse < 0.8) return;
            console.log(collisionEvent);
            //Assets.OuchSound.play();
        });

        for (const child of this.instanceRoot.getChildMeshes()) {
            if (child.name.includes("mainThruster")) {
                console.log("Found main thruster");
                this.addMainThruster(child);
            } else if (child.name.includes("rcsThruster")) {
                console.log("Found rcs thruster");
                this.addRCSThruster(child);
            }
        }

        this.warpTunnel = new WarpTunnel(new Vector3(0, 0, 1), scene);
        this.warpTunnel.getTransform().parent = this.getTransform();

        this.scene = scene;
    }

    public setClosestWalkableObject(object: Transformable) {
        this.closestWalkableObject = object;
    }

    public getTransform(): TransformNode {
        return this.aggregate.transformNode;
    }

    private addMainThruster(mesh: AbstractMesh) {
        const direction = mesh.getDirection(new Vector3(0, 1, 0));
        this.mainThrusters.push(new MainThruster(mesh, direction, this.aggregate));
    }

    private addRCSThruster(mesh: AbstractMesh) {
        const direction = mesh.getDirection(new Vector3(0, 1, 0));
        const thruster = new RCSThruster(mesh, direction, this.aggregate);
        this.rcsThrusters.push(thruster);

        //FIXME: this is temporary to balance rc thrust
        thruster.setMaxAuthority(thruster.getMaxAuthority() / thruster.leverage);
    }

    public setEnabled(enabled: boolean, havokPlugin: HavokPlugin) {
        this.instanceRoot.setEnabled(enabled);
        setEnabledBody(this.aggregate.body, enabled, havokPlugin);
    }

    public registerClosestObject(distance: number, radius: number) {
        this.closestObject = { distance, radius };
    }

    public enableWarpDrive() {
        for (const thruster of this.mainThrusters) thruster.setThrottle(0);
        for (const thruster of this.rcsThrusters) thruster.deactivate();
        this.warpDrive.enable();
        this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    }

    public disableWarpDrive() {
        this.warpDrive.desengage();
        this.aggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    }

    public toggleWarpDrive() {
        if (!this.warpDrive.isEnabled()) this.enableWarpDrive();
        else this.disableWarpDrive();
    }

    /**
     * Returns a readonly interface to the warp drive of the ship.
     * @returns A readonly interface to the warp drive of the ship.
     */
    public getWarpDrive(): WarpDrive {
        return this.warpDrive;
    }

    public setFlightAssistEnabled(enabled: boolean) {
        this.flightAssistEnabled = enabled;
    }

    public getFlightAssistEnabled(): boolean {
        return this.flightAssistEnabled;
    }

    /**
     * Returns the speed of the ship in m/s
     * If warp drive is enabled, returns the warp speed
     * If warp drive is disabled, returns the linear velocity of the ship
     * @returns The speed of the ship in m/s
     */
    public getSpeed(): number {
        return this.warpDrive.isEnabled() ? this.warpDrive.getWarpSpeed() : this.aggregate.body.getLinearVelocity().length();
    }

    public getThrottle(): number {
        return this.warpDrive.isEnabled() ? this.warpDrive.getTargetThrottle() : this.mainThrusters[0].getThrottle();
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
        console.log("landing on", this.landingTarget.getTransform().name);
    }

    private completeLanding() {
        console.log("Landing sequence complete");
        this.state = ShipState.LANDED;
        this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
        this.landingTarget = null;
    }

    public update(deltaTime: number) {
        const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());

        const currentForwardSpeed = Vector3.Dot(warpSpeed, this.aggregate.transformNode.getDirection(Axis.Z));
        this.warpDrive.update(currentForwardSpeed, this.closestObject.distance, this.closestObject.radius, deltaTime);

        this.warpTunnel.setThrottle(this.warpDrive.getInternalThrottle());

        for (const thruster of this.mainThrusters) thruster.update();
        for (const thruster of this.rcsThrusters) thruster.update();

        if (this.warpDrive.isDisabled()) {
            for (const thruster of this.mainThrusters) thruster.applyForce();
            for (const thruster of this.rcsThrusters) thruster.applyForce();

            if (this.closestWalkableObject !== null) {
                const gravityDir = this.closestWalkableObject.getTransform().getAbsolutePosition().subtract(this.getTransform().getAbsolutePosition()).normalize();
                this.aggregate.body.applyForce(gravityDir.scale(9.8), this.aggregate.body.getObjectCenterWorld());
            }
        }

        if (this.flightAssistEnabled) {
            this.aggregate.body.setAngularDamping(0.9);
        } else {
            this.aggregate.body.setAngularDamping(1);
        }

        if (this.state == ShipState.LANDING) {
            if (this.landingTarget === null) {
                throw new Error("Closest walkable object is null while landing");
            }

            const gravityDir = this.landingTarget.getTransform().getAbsolutePosition().subtract(this.getTransform().getAbsolutePosition()).normalize();
            const start = this.getTransform().getAbsolutePosition().add(gravityDir.scale(-50e3));
            const end = this.getTransform().getAbsolutePosition().add(gravityDir.scale(50e3));

            (this.scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, this.raycastResult, { collideWith: CollisionMask.GROUND | CollisionMask.LANDING_PADS });
            if (this.raycastResult.hasHit) {
                const landingSpotNormal = this.raycastResult.hitNormalWorld;
                const extent = this.instanceRoot.getHierarchyBoundingVectors();
                const shipYExtend = extent.max.y - extent.min.y;

                const landingSpot = this.raycastResult.hitPointWorld.add(this.raycastResult.hitNormalWorld.scale(shipYExtend / 2));

                const distance = landingSpot.subtract(this.getTransform().getAbsolutePosition()).dot(gravityDir);
                console.log(500 * deltaTime * Math.sign(distance), distance);
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

    public dispose() {
        this.aggregate.dispose();
        this.instanceRoot.dispose();
    }
}
