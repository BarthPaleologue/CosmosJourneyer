import { Vector3 } from "@babylonjs/core";
import { CollisionData } from "../chunks/workerDataInterfaces";

export enum BodyType {
    STAR,
    SOLID,
    GAZ
}

export interface Seedable {
    /**
     * Returns the seed of the planet
     */
    getSeed(): number;
    getSeed3(): number[];
}

/**
 * Describes object that can be collided with
 */
export interface RigidBody {
    /**
     * Creates a task to check if the given position overlaps with the terrain of the planet
     * @param relativePosition The relative position to the planet
     */
    generateCollisionTask(relativePosition: Vector3): CollisionData;
}
