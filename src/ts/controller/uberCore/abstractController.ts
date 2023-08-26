import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Input } from "../inputs/input";
import { UberCamera } from "./uberCamera";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { TransformNode } from "@babylonjs/core/Meshes";

export abstract class AbstractController {
    /**
     * The inputs that this controller listens to
     */
    protected readonly inputs: Input[] = [];

    /**
     * Returns the camera that should be used to display the player
     */
    public abstract getActiveCamera(): UberCamera;

    /**
     * Listens to input, rotate the controller accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param input the input to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the player to apply to every other mesh given the inputs
     * @internal
     */
    protected abstract listenTo(input: Input, deltaTime: number): Vector3;

    /**
     * Makes the controller listen to all its inputs and returns the displacement to apply to the player
     * @param deltaTime the time between 2 frames
     */
    public abstract update(deltaTime: number): Vector3;

    public addInput(input: Input) {
        this.inputs.push(input);
    }

    public abstract getTransform(): TransformNode;
}
