import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Input } from "../inputs/input";
import { BasicTransform } from "./transforms/basicTransform";
import { UberCamera } from "./uberCamera";
import { Scene } from "@babylonjs/core/scene";

export abstract class AbstractController {
    collisionRadius = 10;

    readonly transform: BasicTransform;

    /**
     * The inputs that this controller listens to
     */
    protected readonly inputs: Input[] = [];

    protected constructor(scene: Scene) {
        this.transform = new BasicTransform("playerTransform", scene);
    }

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
}