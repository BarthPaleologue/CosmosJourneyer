import { Quaternion, Vector3 } from "@babylonjs/core";
import { CollisionData } from "../chunks/workerDataInterfaces";

export enum BodyType {
    STAR,
    SOLID,
    GAZ
}

/**
 * Describes objects that have a position in space and a rotation quaternion
 */
export interface Transformable {
    /**
     * Sets the new position relative to the origin of the universe
     * @param newPosition The new relative position to the origin of the universe to set
     */
    setAbsolutePosition(newPosition: Vector3): void;

    /**
     * Returns the position of the object relative to the origin of the universe
     */
    getAbsolutePosition(): Vector3;

    /**
     * Returns the quaternion describing the rotation of the object
     */
    getRotationQuaternion(): Quaternion;

    /**
     * Returns the inverse of the quaternion describing the rotation of the object
     */
    getInverseRotationQuaternion(): Quaternion;

    /**
     * Translates the object by the given vector in relative space
     * @param displacement The displacement vector
     */
    translate(displacement: Vector3): void;

    /**
     * Rotates the object around a given pivot point by a given amount
     * @param pivot The pivot point for the rotation
     * @param axis The axis of rotation
     * @param amount The angle of rotation in radians
     */
    rotateAround(pivot: Vector3, axis: Vector3, amount: number): void;

    /**
     * Rotates the object in world space by a given amount around a given axis
     * @param axis The given axis to rotate around
     * @param amount The amount of rotation in radians
     */
    rotate(axis: Vector3, amount: number): void;
}

export interface Seedable {}

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
