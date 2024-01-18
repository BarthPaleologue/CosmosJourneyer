import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MainThruster } from "./mainThruster";
import { ReadonlyWarpDrive, WarpDrive } from "./warpDrive";
import { LOCAL_DIRECTION } from "../uberCore/localDirections";
import { RCSThruster } from "./rcsThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { getForwardDirection, getUpwardDirection, pitch, roll, rotate, translate } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Controls } from "../uberCore/controls";
import { Assets } from "../assets";
import { Input, InputType } from "../inputs/input";
import { Keyboard } from "../inputs/keyboard";
import { Mouse } from "../inputs/mouse";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { CollisionMask } from "../settings";
import { Transformable } from "../architecture/transformable";

enum ShipState {
    FLYING,
    LANDING,
    LANDED
}

export class ShipControls implements Controls {
    readonly instanceRoot: AbstractMesh;

    readonly thirdPersonCamera: ArcRotateCamera;
    readonly firstPersonCamera: FreeCamera;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private flightAssistEnabled = true;

    private readonly mainThrusters: MainThruster[] = [];
    private readonly rcsThrusters: RCSThruster[] = [];

    private readonly warpDrive = new WarpDrive(false);

    private closestWalkableObject: Transformable | null = null;
    private readonly raycastResult = new PhysicsRaycastResult();

    private state = ShipState.FLYING;

    private closestObject = {
        distance: Infinity,
        radius: 1
    };

    private inputs: Input[] = [];

    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.instanceRoot = Assets.CreateSpaceShipInstance();

        this.firstPersonCamera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.instanceRoot;
        this.firstPersonCamera.position = new Vector3(0, 1, 0);

        this.thirdPersonCamera = new ArcRotateCamera("thirdPersonCamera", -3.14 / 2, 3.14 / 2, 30, Vector3.Zero(), scene);
        this.thirdPersonCamera.parent = this.instanceRoot;
        this.thirdPersonCamera.lowerRadiusLimit = 10;
        this.thirdPersonCamera.upperRadiusLimit = 500;

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

        this.scene = scene;
    }

    public addInput(input: Input): void {
        this.inputs.push(input);
        if (input.type === InputType.KEYBOARD) {
            const keyboard = input as Keyboard;
            keyboard.addPressedOnceListener("f", () => {
                this.flightAssistEnabled = !this.flightAssistEnabled;
            });
            keyboard.addPressedOnceListener("h", () => {
                this.toggleWarpDrive();
            });
        }
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

    public getActiveCamera(): Camera {
        return this.thirdPersonCamera;
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
    }

    public toggleWarpDrive() {
        if (!this.warpDrive.isEnabled()) this.enableWarpDrive();
        else this.warpDrive.desengage();
    }

    /**
     * Returns a readonly interface to the warp drive of the ship.
     * @returns A readonly interface to the warp drive of the ship.
     */
    public getWarpDrive(): ReadonlyWarpDrive {
        return this.warpDrive;
    }

    private listenTo(input: Input, deltaTime: number) {
        if (this.warpDrive.isDisabled()) {
            for (const thruster of this.mainThrusters) {
                thruster.updateThrottle(2 * deltaTime * input.getZAxis() * thruster.getAuthority01(LOCAL_DIRECTION.FORWARD));
                thruster.updateThrottle(2 * deltaTime * -input.getZAxis() * thruster.getAuthority01(LOCAL_DIRECTION.BACKWARD));

                thruster.updateThrottle(2 * deltaTime * input.getYAxis() * thruster.getAuthority01(LOCAL_DIRECTION.UP));
                thruster.updateThrottle(2 * deltaTime * -input.getYAxis() * thruster.getAuthority01(LOCAL_DIRECTION.DOWN));

                thruster.updateThrottle(2 * deltaTime * input.getXAxis() * thruster.getAuthority01(LOCAL_DIRECTION.LEFT));
                thruster.updateThrottle(2 * deltaTime * -input.getXAxis() * thruster.getAuthority01(LOCAL_DIRECTION.RIGHT));
            }

            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;
                if (keyboard.isPressed("r")) {
                    this.aggregate.body.applyForce(getUpwardDirection(this.getTransform()).scale(9.8 * 10), this.aggregate.body.getObjectCenterWorld());
                }

                if (keyboard.isPressed("l")) {
                    if (this.closestWalkableObject === null) return;

                    console.log("Landing sequence engaged");
                    this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);

                    this.state = ShipState.LANDING;
                }
            }

            if (input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const roll = mouse.getRoll();
                const pitch = mouse.getPitch();

                for (const rcsThruster of this.rcsThrusters) {
                    let throttle = 0;

                    // rcs rotation contribution
                    if (roll < 0 && rcsThruster.getRollAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(roll));
                    else if (roll > 0 && rcsThruster.getRollAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(roll));

                    if (pitch < 0 && rcsThruster.getPitchAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(pitch));
                    else if (pitch > 0 && rcsThruster.getPitchAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(pitch));

                    rcsThruster.setThrottle(throttle);
                }

                mouse.reset();
            }

            if (this.closestWalkableObject) {
                const gravityDir = this.closestWalkableObject.getTransform().getAbsolutePosition().subtract(this.getTransform().getAbsolutePosition()).normalize();
                this.aggregate.body.applyForce(gravityDir.scale(9.8), this.aggregate.body.getObjectCenterWorld());
            }
        } else {
            if (input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const rollContribution = mouse.getRoll();
                const pitchContribution = mouse.getPitch();

                roll(this.aggregate.transformNode, rollContribution * deltaTime);
                pitch(this.aggregate.transformNode, pitchContribution * deltaTime);

                mouse.reset();
            }

            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;
                const deltaThrottle = keyboard.getZAxis() * deltaTime;
                this.warpDrive.increaseTargetThrottle(deltaThrottle);
            }

            const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());
            //this.aggregate.body.setLinearVelocity(warpSpeed);
            translate(this.aggregate.transformNode, warpSpeed.scale(deltaTime));
        }
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

    public update(deltaTime: number): Vector3 {
        for (const input of this.inputs) this.listenTo(input, deltaTime);
        //const displacement = this.transform.update(deltaTime).negate();

        const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed()); //Vector3.Zero();

        const currentForwardSpeed = Vector3.Dot(warpSpeed, this.aggregate.transformNode.getDirection(Axis.Z));
        this.warpDrive.update(currentForwardSpeed, this.closestObject.distance, this.closestObject.radius, deltaTime);

        for (const thruster of this.mainThrusters) thruster.update();
        for (const thruster of this.rcsThrusters) thruster.update();

        if (this.warpDrive.isDisabled()) {
            for (const thruster of this.mainThrusters) thruster.applyForce();
            for (const thruster of this.rcsThrusters) thruster.applyForce();
        }

        if (this.flightAssistEnabled) {
            this.aggregate.body.setAngularDamping(0.9);
        } else {
            this.aggregate.body.setAngularDamping(1);
        }

        if (this.state == ShipState.LANDING) {
            if (this.closestWalkableObject === null) {
                throw new Error("Closest walkable object is null");
            }

            const gravityDir = this.closestWalkableObject.getTransform().getAbsolutePosition().subtract(this.getTransform().getAbsolutePosition()).normalize();
            const start = this.getTransform().getAbsolutePosition().add(gravityDir.scale(-50e3));
            const end = this.getTransform().getAbsolutePosition().add(gravityDir.scale(50e3));

            (this.scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, this.raycastResult, { collideWith: CollisionMask.GROUND });
            if (this.raycastResult.hasHit) {
                const landingSpotNormal = this.raycastResult.hitNormalWorld;
                const landingSpot = this.raycastResult.hitPointWorld.add(this.raycastResult.hitNormalWorld.scale(2));

                const distance = landingSpot.subtract(this.getTransform().getAbsolutePosition()).dot(gravityDir);
                console.log(500 * deltaTime * Math.sign(distance), distance);
                translate(this.getTransform(), gravityDir.scale(Math.min(500 * deltaTime * Math.sign(distance), distance)));

                const currentUp = getUpwardDirection(this.getTransform());
                const targetUp = landingSpotNormal;
                const axis = Vector3.Cross(currentUp, targetUp);
                const theta = Math.acos(Vector3.Dot(currentUp, targetUp));
                rotate(this.getTransform(), axis, Math.min(0.1 * deltaTime, theta));

                if (Math.abs(distance) < 0.3 && Math.abs(theta) < 0.01) {
                    this.state = ShipState.LANDED;
                    this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
                }
            }
        }

        this.getActiveCamera().getViewMatrix();
        return this.getTransform().getAbsolutePosition();
    }

    dispose() {
        this.instanceRoot.dispose();
        this.aggregate.dispose();
        this.thirdPersonCamera.dispose();
        this.firstPersonCamera.dispose();
    }
}
