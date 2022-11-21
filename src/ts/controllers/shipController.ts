import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";
import { Input, InputType } from "../inputs/input";
import { Scene, Vector3 } from "@babylonjs/core";
import { UberCamera } from "../uberCore/uberCamera";
import { AbstractController } from "../uberCore/abstractController";
import { Assets } from "../assets";
import { Keyboard } from "../inputs/keyboard";
import { UberOrbitCamera } from "../uberCore/uberOrbitCamera";
import { Mouse } from "../inputs/mouse";

export class ShipController extends AbstractController {
    readonly transform: NewtonianTransform;

    readonly rollAuthority = 1;
    readonly pitchAuthority = 1;
    readonly yawAuthority = 1;

    readonly forwardAuthority = 10000;
    readonly verticalAuthority = 10000;
    readonly sideAuthority = 10000;

    readonly thirdPersonCamera: UberOrbitCamera;
    readonly firstPersonCamera: UberCamera;

    flightAssistEnabled = true;
    isHyperAccelerated = false;

    constructor(scene: Scene) {
        super();

        this.transform = new NewtonianTransform("shipTransform");

        this.firstPersonCamera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.transform.node;

        this.thirdPersonCamera = new UberOrbitCamera("thirdPersonCamera", Vector3.Zero(), scene, 30, 3.14, 1.4);
        this.thirdPersonCamera.parent = this.transform.node;

        const spaceship = Assets.Spaceship.createInstance("spaceshipdemo");
        spaceship.parent = this.transform.node;
    }

    getActiveCamera(): UberCamera {
        return this.thirdPersonCamera;
    }

    listenTo(input: Input, deltaTime: number): Vector3 {
        if (input.type == InputType.KEYBOARD) {
            const keyboard = input as Keyboard;
            if (keyboard.isPressed("u")) this.isHyperAccelerated = !this.isHyperAccelerated;
            if (keyboard.isPressed("1")) this.thirdPersonCamera.rotatePhi(0.8 * deltaTime);
            if (keyboard.isPressed("3")) this.thirdPersonCamera.rotatePhi(-0.8 * deltaTime);
            if (keyboard.isPressed("5")) this.thirdPersonCamera.rotateTheta(-0.8 * deltaTime);
            if (keyboard.isPressed("2")) this.thirdPersonCamera.rotateTheta(0.8 * deltaTime);
        }
        if(input.type == InputType.MOUSE) {
            const mouse = input as Mouse;
            this.thirdPersonCamera.rotatePhi(mouse.getYaw() * deltaTime);
            this.thirdPersonCamera.rotateTheta(mouse.getPitch() * deltaTime);
        }
        this.transform.rotationAcceleration.x += this.rollAuthority * input.getRoll() * deltaTime;
        this.transform.rotationAcceleration.y += this.pitchAuthority * input.getPitch() * deltaTime;
        this.transform.rotationAcceleration.z += this.yawAuthority * input.getYaw() * deltaTime;

        const forwardAcceleration = this.transform
            .getForwardDirection()
            .scale(this.forwardAuthority * deltaTime)
            .scaleInPlace(input.getZAxis());
        const verticalAcceleration = this.transform
            .getUpwardDirection()
            .scale(this.verticalAuthority * deltaTime)
            .scaleInPlace(input.getYAxis());
        const sideAcceleration = this.transform
            .getRightDirection()
            .scale(this.sideAuthority * deltaTime)
            .scaleInPlace(input.getXAxis());

        this.transform.acceleration.addInPlace(forwardAcceleration);
        this.transform.acceleration.addInPlace(verticalAcceleration);
        this.transform.acceleration.addInPlace(sideAcceleration);

        return Vector3.Zero();
    }

    update(deltaTime: number): Vector3 {
        //this.thirdPersonCamera.rotatePhi(0.02);
        this.transform.rotationAcceleration.copyFromFloats(0, 0, 0);
        this.transform.acceleration.copyFromFloats(0, 0, 0);
        for (const input of this.inputs) this.listenTo(input, deltaTime);
        const displacement = this.transform.update(deltaTime).negate();
        if (this.flightAssistEnabled && this.transform.rotationAcceleration.length() == 0) {
            this.transform.rotationSpeed.scaleInPlace(0.9);
        }
        this.transform.translate(displacement);
        return displacement;
    }
}
