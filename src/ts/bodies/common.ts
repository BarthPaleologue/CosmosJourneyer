import { Vector3 } from "@babylonjs/core";
import { TransferCollisionData } from "../chunks/workerDataTypes";

/**
 * Describes object that can be collided with
 */
export interface RigidBody {
    /**
     * Creates a task to check if the given position overlaps with the terrain of the planet
     * @param relativePosition The relative position to the planet
     */
    generateCollisionTask(relativePosition: Vector3): TransferCollisionData;
}
