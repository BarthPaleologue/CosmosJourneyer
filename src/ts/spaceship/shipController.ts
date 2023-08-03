import { NewtonianTransform } from "../controller/uberCore/transforms/newtonianTransform";
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
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export class ShipController extends AbstractController {
    readonly transform: NewtonianTransform;

    readonly rollAuthority = 0.1;
    readonly pitchAuthority = 1;
    readonly yawAuthority = 1;

    readonly thirdPersonCamera: UberOrbitCamera;
    readonly firstPersonCamera: UberCamera;

    private flightAssistEnabled = true;

    private readonly mainThrusters: MainThruster[] = [];
    private readonly rcsThrusters: RCSThruster[] = [];

    private readonly warpDrive = new WarpDrive(true);

    private closestDistanceToPlanet = Infinity;

    constructor(scene: Scene) {
        super(scene);

        this.transform = new NewtonianTransform("shipTransform", scene);

        this.firstPersonCamera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.transform.node;
        this.firstPersonCamera.position = new Vector3(0, 1, 0);

        this.thirdPersonCamera = new UberOrbitCamera("thirdPersonCamera", Vector3.Zero(), scene, 30, 3.14, 1.4);
        this.thirdPersonCamera.parent = this.transform.node;

        const spaceship = Assets.CreateSpaceShipInstance();
        spaceship.parent = this.transform.node;

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
        this.mainThrusters.push(new MainThruster(mesh, direction, this.transform));
    }

    private addRCSThruster(mesh: AbstractMesh) {
        const direction = mesh.getDirection(new Vector3(0, 1, 0));
        const thruster = new RCSThruster(mesh, direction, this.transform);
        this.rcsThrusters.push(thruster);

        //FIXME: this is temporary to balance rc thrust
        thruster.setMaxAuthority(1 / thruster.leverage);
    }

    public override getActiveCamera(): UberCamera {
        return this.thirdPersonCamera;
    }

    public setHidden(hidden: boolean) {
        this.transform.node.setEnabled(!hidden);
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

            this.transform.rotationAcceleration.x = this.getTotalRollAuthority() * deltaTime;
            this.transform.rotationAcceleration.y = this.getTotalPitchAuthority() * deltaTime;
            this.transform.rotationAcceleration.z = this.getTotalYawAuthority() * deltaTime;

            const forwardAcceleration = this.transform.getForwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.FORWARD) * deltaTime);
            const backwardAcceleration = this.transform.getBackwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.BACKWARD) * deltaTime);

            const upwardAcceleration = this.transform.getUpwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.UP) * deltaTime);
            const downwardAcceleration = this.transform.getDownwardDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.DOWN) * deltaTime);

            const rightAcceleration = this.transform.getRightDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.RIGHT) * deltaTime);
            const leftAcceleration = this.transform.getLeftDirection().scale(this.getTotalAuthority(LOCAL_DIRECTION.LEFT) * deltaTime);

            this.transform.acceleration.addInPlace(forwardAcceleration);
            this.transform.acceleration.addInPlace(backwardAcceleration);

            this.transform.acceleration.addInPlace(upwardAcceleration);
            this.transform.acceleration.addInPlace(downwardAcceleration);

            this.transform.acceleration.addInPlace(rightAcceleration);
            this.transform.acceleration.addInPlace(leftAcceleration);
        } else {
            if(input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const roll = mouse.getRoll();
                const pitch = mouse.getPitch();
                
                this.transform.rotationAcceleration.x += 2 * this.rollAuthority * roll * deltaTime;
                this.transform.rotationAcceleration.y += this.pitchAuthority * pitch * deltaTime;
            }

            const warpSpeed = this.transform.getForwardDirection().scale(this.warpDrive.getWarpSpeed());
            this.transform.speed.copyFrom(warpSpeed);
        }
        return Vector3.Zero();
    }

    public override update(deltaTime: number): Vector3 {
        this.transform.rotationAcceleration.copyFromFloats(0, 0, 0);
        this.transform.acceleration.copyFromFloats(0, 0, 0);

        for (const input of this.inputs) this.listenTo(input, deltaTime);
        const displacement = this.transform.update(deltaTime).negate();

        const currentForwardSpeed = Vector3.Dot(this.transform.speed, this.transform.getForwardDirection());
        this.warpDrive.update(currentForwardSpeed, this.closestDistanceToPlanet, deltaTime);

        for (const thruster of this.mainThrusters) thruster.update();
        for (const thruster of this.rcsThrusters) thruster.update();

        if (this.flightAssistEnabled && this.transform.rotationAcceleration.length() === 0) {
            this.transform.rotationSpeed.scaleInPlace(0.9);
        }

        //TODO: should be separated from the ship
        (document.querySelector("#speedometer") as HTMLElement).innerHTML = `${parseSpeed(this.transform.speed.length())}`;

        this.transform.translate(displacement);
        return displacement;
    }
}
