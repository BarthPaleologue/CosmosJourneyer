import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Input } from "../inputs/input";

import { Transformable } from "./transforms/basicTransform";
import { Camera } from "@babylonjs/core/Cameras/camera";

export interface Controls extends Transformable {
    /**
     * Returns the camera that should be used to display the player
     */
    getActiveCamera(): Camera;

    /**
     * Makes the controller listen to all its inputs and returns the displacement to apply to the player
     * @param deltaTime the time between 2 frames
     */
    update(deltaTime: number): Vector3;

    addInput(input: Input): void;
}
