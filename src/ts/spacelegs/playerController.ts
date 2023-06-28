import { AbstractController } from "../controller/uberCore/abstractController";
import { UberCamera } from "../controller/uberCore/uberCamera";
import { Input } from "../controller/inputs/input";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class PlayerController extends AbstractController {
    private readonly camera: UberCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    constructor(scene: Scene) {
        super(scene);

        this.camera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform.node;
        this.camera.fov = (80 / 360) * Math.PI;
    }

    public override getActiveCamera(): UberCamera {
        return this.camera;
    }

    protected override listenTo(input: Input, deltaTime: number): Vector3 {
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

    public override update(deltaTime: number): Vector3 {
        const playerMovement = Vector3.Zero();
        for (const input of this.inputs) playerMovement.addInPlace(this.listenTo(input, deltaTime));
        return playerMovement;
    }
}
