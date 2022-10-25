import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";
import { Input, InputType } from "../inputs/input";
import { Vector3 } from "@babylonjs/core";
import { UberFreeCamera } from "../uberCore/uberFreeCamera";
import { AbstractController } from "./abstractController";
import { Assets } from "../assets";
import { Keyboard } from "../inputs/keyboard";

export class ShipController extends AbstractController {
    readonly transform: NewtonianTransform;

    readonly rollAuthority = 1;
    readonly pitchAuthority = 1;
    readonly yawAuthority = 1;

    readonly forwardAuthority = 10000;
    readonly verticalAuthority = 10000;
    readonly sideAuthority = 10000;

    readonly thirdPersonCamera: UberFreeCamera;
    readonly firstPersonCamera: UberFreeCamera;

    flightAssistEnabled = true;
    isHyperAccelerated = false;

    constructor() {
        super();

        this.transform = new NewtonianTransform("shipTransform");

        this.firstPersonCamera = new UberFreeCamera("firstPersonCamera", Vector3.Zero());
        this.firstPersonCamera.parent = this.transform.node;

        this.thirdPersonCamera = new UberFreeCamera("thirdPersonCamera", Vector3.Zero());
        this.thirdPersonCamera.parent = this.transform.node;
        //this.thirdPersonCamera.position.z = -5;
        //this.thirdPersonCamera.position.y = 2;

        const spaceship = Assets.Spaceship.createInstance("spaceshipdemo");
        spaceship.parent = this.transform.node;
        spaceship.position.z = 5;
        spaceship.position.y = -2;
    }

    getActiveCamera(): UberFreeCamera {
        return this.thirdPersonCamera;
    }

    listenTo(input: Input, deltaTime: number): Vector3 {
        if (input.type == InputType.KEYBOARD) {
            const keyboard = input as Keyboard;
            if (keyboard.isPressed("U")) this.isHyperAccelerated = !this.isHyperAccelerated;
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
