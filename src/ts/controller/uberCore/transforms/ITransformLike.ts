import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Describes objects that have a position in space and a rotation quaternion
 */
export interface ITransformLike {
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