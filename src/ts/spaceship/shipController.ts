import { Input, InputType } from "../controller/inputs/input";
import { UberCamera } from "../controller/uberCore/uberCamera";
import { AbstractController } from "../controller/uberCore/abstractController";
import { Assets } from "../controller/assets";
import { Keyboard } from "../controller/inputs/keyboard";
import { UberOrbitCamera } from "../controller/uberCore/uberOrbitCamera";
import { Mouse } from "../controller/inputs/mouse";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MainThruster } from "./mainThruster";
import { WarpDrive } from "./warpDrive";
import { parseSpeed } from "../utils/parseSpeed";
import { LOCAL_DIRECTION } from "../controller/uberCore/localDirections";
import { RCSThruster } from "./rcsThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { PhysicsViewer } from "@babylonjs/core/Debug/physicsViewer";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { getForwardDirection, pitch, roll, translate } from "../controller/uberCore/transforms/basicTransform";

export class ShipController extends AbstractController {
    //readonly transform: NewtonianTransform;
    readonly instanceRoot: AbstractMesh;

    readonly rollAuthority = 0.1;
    readonly pitchAuthority = 1;
    readonly yawAuthority = 1;

    readonly thirdPersonCamera: UberOrbitCamera;
    readonly firstPersonCamera: UberCamera;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private flightAssistEnabled = true;

    private readonly mainThrusters: MainThruster[] = [];
    private readonly rcsThrusters: RCSThruster[] = [];

    private readonly warpDrive = new WarpDrive(true);

    private closestDistanceToPlanet = Infinity;

    constructor(scene: Scene) {
        super();

        const spaceship = Assets.CreateSpaceShipInstance();
        this.instanceRoot = spaceship;

        this.firstPersonCamera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.instanceRoot;
        this.firstPersonCamera.position = new Vector3(0, 1, 0);

        this.thirdPersonCamera = new UberOrbitCamera("thirdPersonCamera", Vector3.Zero(), scene, 30, 3.14, 1.4);
        this.thirdPersonCamera.parent = this.instanceRoot;

        //const viewer = new PhysicsViewer();

        this.aggregate = new PhysicsAggregate(spaceship
            , PhysicsShapeType.CONTAINER, { mass: 10, restitution: 0.2 }, scene);
        for (const child of spaceship.getChildMeshes()) {
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            this.aggregate.shape.addChildFromParent(spaceship, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;

        //viewer.showBody(this.aggregate.body);

        this.aggregate.body.setCollisionCallbackEnabled(true);

        this.collisionObservable = this.aggregate.body.getCollisionObservable();
        this.collisionObservable.add((collisionEvent: IPhysicsCollisionEvent) => {
            if (collisionEvent.impulse < 0.8) return;
            Assets.OuchSound.play();
        });

        for (const child of spaceship.getChildMeshes()) {
            if (child.name.includes("mainThruster")) {
                console.log("Found main thruster");
                this.addMainThruster(child);
            } else if (child.name.includes("rcsThruster")) {
                console.log("Found rcs thruster");
                this.addRCSThruster(child);
            }
        }
    }

    public override addInput(input: Input): void {
        super.addInput(input);
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

    private addMainThruster(mesh: AbstractMesh) {
        const direction = mesh.getDirection(new Vector3(0, 1, 0));
        this.mainThrusters.push(new MainThruster(mesh, direction, this.aggregate));
    }

    private addRCSThruster(mesh: AbstractMesh) {
        const direction = mesh.getDirection(new Vector3(0, 1, 0));
        const thruster = new RCSThruster(mesh, direction, this.aggregate);
        this.rcsThrusters.push(thruster);

        //FIXME: this is temporary to balance rc thrust
        thruster.setMaxAuthority(1 / thruster.leverage);
    }

    public override getActiveCamera(): UberCamera {
        return this.thirdPersonCamera;
    }

    public setEnabled(enabled: boolean, havokPlugin: HavokPlugin) {
        this.instanceRoot.setEnabled(enabled);
        setEnabledBody(this.aggregate.body, enabled, havokPlugin);
    }

    public registerClosestDistanceToPlanet(distance: number) {
        this.closestDistanceToPlanet = distance;
    }

    public enableWarpDrive() {
        for(const thruster of this.mainThrusters) thruster.setThrottle(0);
        for(const thruster of this.rcsThrusters) thruster.deactivate();
        this.warpDrive.enable();
    }

    public toggleWarpDrive() {
        if (!this.warpDrive.isEnabled()) this.enableWarpDrive();
        else this.warpDrive.desengage();
    }

    private getTotalAuthority(direction: Vector3) {
        let totalAuthority = 0;
        for (const thruster of this.mainThrusters) totalAuthority += thruster.getAuthority(direction);
        for (const thruster of this.rcsThrusters) totalAuthority += thruster.getAuthority(direction);
        return totalAuthority;
    }

    private getTotalRollAuthority() {
        let totalAuthority = 0;
        // only rcs thrusters can contribute to roll authority
        for (const thruster of this.rcsThrusters) {
            totalAuthority += thruster.getAuthorityAroundAxis(LOCAL_DIRECTION.FORWARD);
            totalAuthority -= thruster.getAuthorityAroundAxis(LOCAL_DIRECTION.BACKWARD);
        }

        return totalAuthority;
    }

    private getTotalPitchAuthority() {
        let totalAuthority = 0;
        // only rcs thrusters can contribute to pitch authority
        for (const thruster of this.rcsThrusters) {
            totalAuthority += thruster.getAuthorityAroundAxis(LOCAL_DIRECTION.RIGHT);
            totalAuthority -= thruster.getAuthorityAroundAxis(LOCAL_DIRECTION.LEFT);
        }

        return totalAuthority;
    }

    private getTotalYawAuthority() {
        let totalAuthority = 0;
        // only rcs thrusters can contribute to yaw authority
        for (const thruster of this.rcsThrusters) {
            totalAuthority += thruster.getAuthorityAroundAxis(LOCAL_DIRECTION.UP);
            totalAuthority -= thruster.getAuthorityAroundAxis(LOCAL_DIRECTION.DOWN);
        }

        return totalAuthority;
    }

    protected override listenTo(input: Input, deltaTime: number): Vector3 {
        if (this.getActiveCamera() === this.thirdPersonCamera) {
            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;
                if (keyboard.isPressed("1")) this.thirdPersonCamera.rotatePhi(0.8 * deltaTime);
                if (keyboard.isPressed("3")) this.thirdPersonCamera.rotatePhi(-0.8 * deltaTime);
                if (keyboard.isPressed("5")) this.thirdPersonCamera.rotateTheta(-0.8 * deltaTime);
                if (keyboard.isPressed("2")) this.thirdPersonCamera.rotateTheta(0.8 * deltaTime);
            }
        }

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
                // if we are listenning to multiple inputs, the thrusters will be activated and deactivated multiple times
                for (const rcsThruster of this.rcsThrusters) {
                    // rcs linear contribution
                    if (input.getZAxis() > 0 && rcsThruster.getAuthority01(LOCAL_DIRECTION.FORWARD) > 0.5) rcsThruster.activate();
                    else if (input.getZAxis() < 0 && rcsThruster.getAuthority01(LOCAL_DIRECTION.BACKWARD) > 0.5) rcsThruster.activate();
                    else if (input.getYAxis() > 0 && rcsThruster.getAuthority01(LOCAL_DIRECTION.UP) > 0.5) rcsThruster.activate();
                    else if (input.getYAxis() < 0 && rcsThruster.getAuthority01(LOCAL_DIRECTION.DOWN) > 0.5) rcsThruster.activate();
                    else if (input.getXAxis() > 0 && rcsThruster.getAuthority01(LOCAL_DIRECTION.RIGHT) > 0.5) rcsThruster.activate();
                    else if (input.getXAxis() < 0 && rcsThruster.getAuthority01(LOCAL_DIRECTION.LEFT) > 0.5) rcsThruster.activate();
                    else rcsThruster.deactivate();
                }
            }

            if(input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const roll = mouse.getRoll();
                const pitch = mouse.getPitch();
                
                for (const rcsThruster of this.rcsThrusters) {
                    // rcs rotation contribution
                    if (roll < 0 && rcsThruster.getAuthorityAroundAxis01(LOCAL_DIRECTION.FORWARD) > 0.2) rcsThruster.setThrottle(Math.abs(roll));
                    else if (roll > 0 && rcsThruster.getAuthorityAroundAxis01(LOCAL_DIRECTION.BACKWARD) > 0.2) rcsThruster.setThrottle(Math.abs(roll));
                    
                    if (pitch > 0 && rcsThruster.getAuthorityAroundAxis01(LOCAL_DIRECTION.RIGHT) > 0.2) rcsThruster.setThrottle(Math.abs(pitch));
                    else if (pitch < 0 && rcsThruster.getAuthorityAroundAxis01(LOCAL_DIRECTION.LEFT) > 0.2) rcsThruster.setThrottle(Math.abs(pitch));
                }
            }

            /*this.transform.rotationAcceleration.x = this.getTotalRollAuthority() * deltaTime;
            this.transform.rotationAcceleration.y = this.getTotalPitchAuthority() * deltaTime;
            this.transform.rotationAcceleration.z = this.getTotalYawAuthority() * deltaTime;*/

            /*const forwardAcceleration = this.transform.getForwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.FORWARD) * deltaTime);
            const backwardAcceleration = this.transform.getBackwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.BACKWARD) * deltaTime);

            const upwardAcceleration = this.transform.getUpwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.UP) * deltaTime);
            const downwardAcceleration = this.transform.getDownwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.DOWN) * deltaTime);

            const rightAcceleration = this.transform.getRightDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.RIGHT) * deltaTime);
            const leftAcceleration = this.transform.getLeftDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.LEFT) * deltaTime);*/

            /*this.transform.acceleration.addInPlace(forwardAcceleration);
            this.transform.acceleration.addInPlace(backwardAcceleration);

            this.transform.acceleration.addInPlace(upwardAcceleration);
            this.transform.acceleration.addInPlace(downwardAcceleration);

            this.transform.acceleration.addInPlace(rightAcceleration);
            this.transform.acceleration.addInPlace(leftAcceleration);*/
        } else {
            if(input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const rollContribution = mouse.getRoll();
                const pitchContribution = mouse.getPitch();
                
                roll(this.aggregate.transformNode, rollContribution * deltaTime);
                pitch(this.aggregate.transformNode, pitchContribution * deltaTime);
                /*this.transform.rotationAcceleration.x += 2 * this.rollAuthority * roll * deltaTime;
                this.transform.rotationAcceleration.y += this.pitchAuthority * pitch * deltaTime;*/
            }

            const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());
            //this.aggregate.body.setLinearVelocity(warpSpeed);
            translate(this.aggregate.transformNode, warpSpeed.scale(deltaTime));
        }
        return Vector3.Zero();
    }

    public override update(deltaTime: number): Vector3 {
        for (const input of this.inputs) this.listenTo(input, deltaTime);
        //const displacement = this.transform.update(deltaTime).negate();

        const speed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());//Vector3.Zero();
        //this.aggregate.body.getLinearVelocityToRef(speed);

        const currentForwardSpeed = Vector3.Dot(speed, this.aggregate.transformNode.getDirection(Axis.Z));
        this.warpDrive.update(currentForwardSpeed, this.closestDistanceToPlanet, deltaTime);

        for (const thruster of this.mainThrusters) thruster.update();
        for (const thruster of this.rcsThrusters) thruster.update();

        if (this.flightAssistEnabled /*&& this.transform.rotationAcceleration.length() === 0*/) {
            this.aggregate.body.setAngularDamping(0.9);
            //this.transform.rotationSpeed.scaleInPlace(0.9);
        } else {
            this.aggregate.body.setAngularDamping(1);
        }

        //TODO: should be separated from the ship
        (document.querySelector("#speedometer") as HTMLElement).innerHTML = `${parseSpeed(speed.length())}`;

        //this.transform.translate(displacement);
        //console.log(this.aggregate.transformNode.getAbsolutePosition());
        return this.aggregate.transformNode.getAbsolutePosition();
    }
}
