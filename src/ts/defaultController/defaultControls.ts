import { Controls } from "../uberCore/controls";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getForwardDirection, getRightDirection, getUpwardDirection, pitch, roll, translate, yaw } from "../uberCore/transforms/basicTransform";
import { Input } from "../inputs/input";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { LOCAL_DIRECTION } from "../uberCore/localDirections";
import { getTransformationQuaternion } from "../utils/algebra";
import { Quaternion } from "@babylonjs/core/Maths/math";

export class DefaultControls implements Controls {
    private readonly transform: TransformNode;
    private readonly camera: FreeCamera;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    private readonly inputs: Input[] = [];

    constructor(scene: Scene) {
        this.transform = new TransformNode("playerController", scene);

        this.camera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform;
        this.camera.speed = 0;
        this.camera.fov = (80 / 360) * Math.PI;
    }

    public getActiveCamera(): Camera {
        return this.camera;
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    /**
     * Listens to input, rotate the controller accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param input the input to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the player to apply to every other mesh given the inputs
     * @internal
     */
    private listenTo(input: Input, deltaTime: number): Vector3 {
        roll(this.transform, input.getRoll() * this.rotationSpeed * deltaTime);
        pitch(this.transform, input.getPitch() * this.rotationSpeed * deltaTime);
        yaw(this.transform, input.getYaw() * this.rotationSpeed * deltaTime);

        const cameraForward = this.camera.getDirection(LOCAL_DIRECTION.BACKWARD);
        const transformForward = getForwardDirection(this.transform);

        if (!cameraForward.equalsWithEpsilon(transformForward)) {
            const rotation = getTransformationQuaternion(transformForward, cameraForward);
            this.transform.rotationQuaternion = rotation.multiply(this.transform.rotationQuaternion ?? Quaternion.Identity());
            this.camera.rotationQuaternion = Quaternion.Identity();
        }

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

    public update(deltaTime: number): Vector3 {
        const playerMovement = Vector3.Zero();

        for (const input of this.inputs) playerMovement.addInPlace(this.listenTo(input, this.transform.getScene().getEngine().getDeltaTime() / 1000));
        translate(this.transform, playerMovement);
        this.getActiveCamera().getViewMatrix();
        return playerMovement;
    }

    public addInput(input: Input): void {
        this.inputs.push(input);
    }
}