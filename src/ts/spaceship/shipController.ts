import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";
import { Input, InputType } from "../inputs/input";
import { UberCamera } from "../uberCore/uberCamera";
import { AbstractController } from "../uberCore/abstractController";
import { Assets } from "../assets";
import { Keyboard } from "../inputs/keyboard";
import { UberOrbitCamera } from "../uberCore/uberOrbitCamera";
import { Mouse } from "../inputs/mouse";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { DirectionnalParticleSystem } from "../utils/particleSystem";

class Thruster {
    readonly plume: DirectionnalParticleSystem;
    readonly mesh: AbstractMesh;

    constructor(mesh: AbstractMesh) {
        this.mesh = mesh;
        this.plume = new DirectionnalParticleSystem(mesh, new Vector3(1, 0, 0));
    }
}

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

    private flightAssistEnabled = true;
    private isHyperAccelerated = false;

    private readonly thrusters: Thruster[] = [];

    constructor(scene: Scene) {
        super();

        this.transform = new NewtonianTransform("shipTransform");

        this.firstPersonCamera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.transform.node;

        this.thirdPersonCamera = new UberOrbitCamera("thirdPersonCamera", Vector3.Zero(), scene, 30, 3.14, 1.4);
        this.thirdPersonCamera.parent = this.transform.node;

        const spaceship = Assets.CreateSpaceShipInstance();
        spaceship.parent = this.transform.node;

        spaceship.getChildMeshes().forEach((child) => {
            if (child.name.includes("thruster")) {
                console.log("Found thruster");
                this.addThruster(child);
            }
        });
    }

    public override addInput(input: Input): void {
        super.addInput(input);
        if (input.type == InputType.KEYBOARD) {
            const keyboard = input as Keyboard;
            keyboard.addPressedOnceListener("f", () => {
                this.flightAssistEnabled = !this.flightAssistEnabled;
            });
            keyboard.addPressedOnceListener("h", () => {
                this.isHyperAccelerated = !this.isHyperAccelerated;
            });
        }
    }

    private addThruster(mesh: AbstractMesh) {
        this.thrusters.push(new Thruster(mesh));
    }

    getActiveCamera(): UberCamera {
        return this.thirdPersonCamera;
    }

    listenTo(input: Input, deltaTime: number): Vector3 {
        if (input.type == InputType.KEYBOARD) {
            const keyboard = input as Keyboard;
            if (keyboard.isPressed("1")) this.thirdPersonCamera.rotatePhi(0.8 * deltaTime);
            if (keyboard.isPressed("3")) this.thirdPersonCamera.rotatePhi(-0.8 * deltaTime);
            if (keyboard.isPressed("5")) this.thirdPersonCamera.rotateTheta(-0.8 * deltaTime);
            if (keyboard.isPressed("2")) this.thirdPersonCamera.rotateTheta(0.8 * deltaTime);
        }
        if (input.type == InputType.MOUSE) {
            const mouse = input as Mouse;
            this.thirdPersonCamera.rotatePhi(mouse.getYaw() * deltaTime);
            this.thirdPersonCamera.rotateTheta(mouse.getPitch() * deltaTime);
        }
        this.transform.rotationAcceleration.x += this.rollAuthority * input.getRoll() * deltaTime;
        this.transform.rotationAcceleration.y += this.pitchAuthority * input.getPitch() * deltaTime;
        this.transform.rotationAcceleration.z += this.yawAuthority * input.getYaw() * deltaTime;

        const forwardAcceleration = this.transform
            .getForwardDirection()
            .scale(this.forwardAuthority * deltaTime * (this.isHyperAccelerated ? 100 : 1))
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

        this.thrusters.forEach((thruster) => {
            thruster.plume.emitRate = this.transform.acceleration.length() * 5;
            thruster.plume.setDirection(this.transform.getForwardDirection().negate());
            thruster.plume.applyAcceleration(this.transform.acceleration.negate());
        });

        if (this.flightAssistEnabled && this.transform.rotationAcceleration.length() == 0) {
            this.transform.rotationSpeed.scaleInPlace(0.9);
        }

        this.transform.translate(displacement);
        return displacement;
    }
}
