import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";

export function getPosition(transformNode: TransformNode): Vector3 {
    return transformNode.position;
}

export function translate(transformNode: TransformNode, displacement: Vector3): void {
    transformNode.setAbsolutePosition(transformNode.getAbsolutePosition().add(displacement));
    transformNode.computeWorldMatrix(true);
}

export function rotateAround(transformNode: TransformNode, pivot: Vector3, axis: Vector3, amount: number): void {
    transformNode.rotateAround(pivot, axis, amount);
    transformNode.computeWorldMatrix(true);
}

export function rotate(transformNode: TransformNode, axis: Vector3, amount: number) {
    transformNode.rotate(axis, amount, Space.WORLD);
}

export function getRotationQuaternion(transformNode: TransformNode): Quaternion {
    if (transformNode.rotationQuaternion === undefined) throw new Error(`Undefined quaternion for ${transformNode.name}`);
    if (transformNode.rotationQuaternion === null) throw new Error(`Null quaternion for ${transformNode.name}`);
    return transformNode.rotationQuaternion;
}

export function getInverseRotationQuaternion(transformNode: TransformNode): Quaternion {
    return getRotationQuaternion(transformNode).invert();
}

export function setRotationQuaternion(transformNode: TransformNode, newRotation: Quaternion): void {
    transformNode.rotationQuaternion = newRotation;
    transformNode.computeWorldMatrix(true);
}

export function setUpVector(transformNode: TransformNode, newUp: Vector3): void {
    if (newUp.equalsWithEpsilon(transformNode.up, 1e-7)) return;
    const currentUp = transformNode.up;
    const rotationAxis = Vector3.Cross(newUp, currentUp);
    const angle = -Math.acos(Vector3.Dot(newUp, currentUp));
    const rotation = Quaternion.RotationAxis(rotationAxis, angle);
    setRotationQuaternion(transformNode, rotation.multiply(transformNode.rotationQuaternion ?? Quaternion.Identity()));
}

export function getRotationMatrix(transformNode: TransformNode): Matrix {
    const rotationMatrix = new Matrix();
    getRotationQuaternion(transformNode).toRotationMatrix(rotationMatrix);
    return rotationMatrix;
}

export function getInverseRotationMatrix(transformNode: TransformNode): Matrix {
    const inverseRotationMatrix = new Matrix();
    getInverseRotationQuaternion(transformNode).toRotationMatrix(inverseRotationMatrix);
    return inverseRotationMatrix;
}

/* #region directions */

/**
 * This is not equivalent to transform.forward as CosmosJourneyer uses the right-handed coordinate system
 * @returns the forward vector of the given transform in world space
 */
export function getForwardDirection(transformNode: TransformNode): Vector3 {
    return transformNode.getDirection(Axis.Z);
}

/**
 *
 * @returns the unit vector pointing backward the player controller in world space
 */
export function getBackwardDirection(transformNode: TransformNode): Vector3 {
    return getForwardDirection(transformNode).negate();
}

/**
 *
 * @returns the unit vector pointing upward the player controller in world space
 */
export function getUpwardDirection(transformNode: TransformNode): Vector3 {
    return transformNode.getDirection(Axis.Y);
}

/**
 *
 * @returns the unit vector pointing downward the player controler in world space
 */
export function getDownwardDirection(transformNode: TransformNode): Vector3 {
    return getUpwardDirection(transformNode).negate();
}

/**
 *
 * @returns the unit vector pointing to the right of the player controler in world space
 */
export function getRightDirection(transformNode: TransformNode): Vector3 {
    return getLeftDirection(transformNode).negate();
}

/**
 *
 * @returns the unit vector pointing to the left of the player controler in world space
 */
export function getLeftDirection(transformNode: TransformNode): Vector3 {
    return transformNode.getDirection(Axis.X);
}

/**
 *
 * @param amount
 */
export function roll(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, getForwardDirection(transformNode), amount);
}

/**
 *
 * @param amount
 */
export function pitch(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, getLeftDirection(transformNode), amount);
}

/**
 *
 * @param amount
 */
export function yaw(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, getUpwardDirection(transformNode), amount);
}

/* #endregion directions */

export function dispose(transformNode: TransformNode): void {
    transformNode.dispose();
}

export interface Transformable {
    getTransform(): TransformNode;
}