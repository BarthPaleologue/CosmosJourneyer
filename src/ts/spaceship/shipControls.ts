import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MainThruster } from "./mainThruster";
import { ReadonlyWarpDrive, WarpDrive } from "./warpDrive";
import { LOCAL_DIRECTION } from "../uberCore/localDirections";
import { RCSThruster } from "./rcsThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { getForwardDirection, pitch, roll, translate } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Controls } from "../uberCore/controls";
import { Assets } from "../assets";
import { Input, InputType } from "../inputs/input";
import { Keyboard } from "../inputs/keyboard";
import { Mouse } from "../inputs/mouse";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

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

    private closestObject = {
        distance: Infinity,
        radius: 1
    };

    private inputs: Input[] = [];

    constructor(scene: Scene) {
        this.instanceRoot = Assets.CreateSpaceShipInstance();

        this.firstPersonCamera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.instanceRoot;
        this.firstPersonCamera.position = new Vector3(0, 1, 0);

        this.thirdPersonCamera = new ArcRotateCamera("thirdPersonCamera", -3.14/2, 3.14 / 2, 30, Vector3.Zero(), scene);
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
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;

        this.aggregate.body.setCollisionCallbackEnabled(true);

        this.collisionObservable = this.aggregate.body.getCollisionObservable();
        this.collisionObservable.add((collisionEvent: IPhysicsCollisionEvent) => {
            console.log("Collision", collisionEvent);
            if (collisionEvent.impulse < 0.8) return;
            Assets.OuchSound.play();
        });

        //if(this.warpDrive.isEnabled()) setEnabledBody(this.aggregate.body, false, )

        for (const child of this.instanceRoot.getChildMeshes()) {
            if (child.name.includes("mainThruster")) {
                console.log("Found main thruster");
                this.addMainThruster(child);
            } else if (child.name.includes("rcsThruster")) {
                console.log("Found rcs thruster");
                this.addRCSThruster(child);
            }
        }
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

    private listenTo(input: Input, deltaTime: number): Vector3 {
        if (this.warpDrive.isDisabled()) {
            for (const thruster of this.mainThrusters) {
                thruster.updateThrottle(2 * deltaTime * input.getZAxis() * thruster.getAuthority01(LOCAL_DIRECTION.FORWARD));
                thruster.updateThrottle(2 * deltaTime * -input.getZAxis() * thruster.getAuthority01(LOCAL_DIRECTION.BACKWARD));

                thruster.updateThrottle(2 * deltaTime * input.getYAxis() * thruster.getAuthority01(LOCAL_DIRECTION.UP));
                thruster.updateThrottle(2 * deltaTime * -input.getYAxis() * thruster.getAuthority01(LOCAL_DIRECTION.DOWN));

                thruster.updateThrottle(2 * deltaTime * input.getXAxis() * thruster.getAuthority01(LOCAL_DIRECTION.LEFT));
                thruster.updateThrottle(2 * deltaTime * -input.getXAxis() * thruster.getAuthority01(LOCAL_DIRECTION.RIGHT));
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
        return Vector3.Zero();
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

        //this.transform.translate(displacement);

        this.getActiveCamera().getViewMatrix();
        return this.aggregate.transformNode.getAbsolutePosition();
    }
}