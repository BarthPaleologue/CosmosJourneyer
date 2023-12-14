import { AbstractController } from "../uberCore/abstractController";
import { UberCamera } from "../uberCore/uberCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getForwardDirection, getRightDirection, getUpwardDirection, pitch, roll, translate, yaw } from "../uberCore/transforms/basicTransform";
import { Input, InputType } from "../inputs/input";
import { Mouse } from "../inputs/mouse";

export class DefaultController extends AbstractController {
    private readonly transform: TransformNode;
    private readonly camera: UberCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    constructor(scene: Scene) {
        super();

        this.transform = new TransformNode("playerController", scene);

        this.camera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform;
        this.camera.fov = (80 / 360) * Math.PI;
    }

    public override getActiveCamera(): UberCamera {
        return this.camera;
    }

    public override getTransform(): TransformNode {
        return this.transform;
    }

    protected override listenTo(input: Input, deltaTime: number): Vector3 {
        if (input.type === InputType.MOUSE) {
            const mouse = input as Mouse;
            if (mouse.isLeftButtonPressed()) {
                const dx = mouse.getDxNormalized() * 100;
                const dy = mouse.getDyNormalized() * 100;

                yaw(this.transform, -dx * this.rotationSpeed * deltaTime);
                pitch(this.transform, dy * this.rotationSpeed * deltaTime);
            }
            mouse.reset();
            return Vector3.Zero();
        }
        roll(this.transform, input.getRoll() * this.rotationSpeed * deltaTime);
        pitch(this.transform, input.getPitch() * this.rotationSpeed * deltaTime);
        yaw(this.transform, input.getYaw() * this.rotationSpeed * deltaTime);

        const displacement = Vector3.Zero();

        const forwardDisplacement = getForwardDirection(this.transform)
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getZAxis());
        const upwardDisplacement = getUpwardDirection(this.transform)
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getYAxis());
        const rightDisplacement = getRightDirection(this.transform)
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getXAxis());

        displacement.addInPlace(forwardDisplacement);
        displacement.addInPlace(upwardDisplacement);
        displacement.addInPlace(rightDisplacement);

        if (input.getAcceleration() != 0) this.speed *= 1 + input.getAcceleration() / 10;

        return displacement;
    }

    public override update(deltaTime: number): Vector3 {
        const playerMovement = Vector3.Zero();
        for (const input of this.inputs) playerMovement.addInPlace(this.listenTo(input, this.transform.getScene().deltaTime / 1000));
        translate(this.transform, playerMovement);
        return playerMovement;
    }
}
