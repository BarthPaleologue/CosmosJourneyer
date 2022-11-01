import { AbstractController } from "../uberCore/abstractController";
import { UberCamera } from "../uberCore/uberCamera";
import { Vector3 } from "@babylonjs/core";
import { Input } from "../inputs/input";

export class PlayerController extends AbstractController {
    private readonly camera: UberCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    constructor() {
        super();

        this.camera = new UberCamera("firstPersonCamera", Vector3.Zero());
        this.camera.parent = this.transform.node;
        this.camera.fov = (80 / 360) * Math.PI;
    }

    getActiveCamera(): UberCamera {
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
