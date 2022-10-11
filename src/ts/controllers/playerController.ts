import { AbstractController } from "./abstractController";
import { UberScene } from "../core/uberScene";
import { UberFreeCamera } from "../core/uberFreeCamera";
import { Vector3 } from "@babylonjs/core";
import { Input, InputType } from "../inputs/input";
import { Mouse } from "../inputs/mouse";

export class PlayerController extends AbstractController {
    private readonly camera: UberFreeCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    constructor(scene: UberScene) {
        super();

        this.camera = new UberFreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform.node;
        this.camera.fov = (80 / 360) * Math.PI;
    }

    getActiveCamera(): UberFreeCamera {
        return this.camera;
    }

    public listenTo(input: Input, deltaTime: number): Vector3 {
        /*if(input.type == InputType.MOUSE) {
            const mouse = input as Mouse;
            this.transform.yaw(mouse.getDx() * 100 * this.rotationSpeed * deltaTime);
            this.transform.pitch(mouse.getDy() * 100 * this.rotationSpeed * deltaTime);
        }*/

        this.transform.roll(input.getRoll() * this.rotationSpeed * deltaTime);
        this.transform.pitch(input.getPitch() * this.rotationSpeed * deltaTime);
        this.transform.yaw(input.getYaw() * this.rotationSpeed * deltaTime);

        const displacement = Vector3.Zero();

        const forwardDisplacement = this.transform
            .getForwardDirection()
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getZAxis());
        const upwardDisplacement = this.transform
            .getUpwardDirection()
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getYAxis());
        const rightDisplacement = this.transform
            .getRightDirection()
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getXAxis());

        displacement.addInPlace(forwardDisplacement);
        displacement.addInPlace(upwardDisplacement);
        displacement.addInPlace(rightDisplacement);

        if (input.getAcceleration() != 0) this.speed *= 1 + input.getAcceleration() / 10;

        return displacement.negate();
    }

    public update(deltaTime: number): Vector3 {
        const playerMovement = Vector3.Zero();
        for (const input of this.inputs) playerMovement.addInPlace(this.listenTo(input, deltaTime));
        return playerMovement;
    }
}
