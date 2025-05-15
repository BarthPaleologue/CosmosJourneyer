//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Space } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { LocalDirection } from "../localDirections";

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
    if (transformNode.rotationQuaternion === null) throw new Error(`Null quaternion for ${transformNode.name}`);
    return transformNode.rotationQuaternion;
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
    rotate(transformNode, rotationAxis, angle);
}

/* #region directions */

/**
 * This is not equivalent to `transform.forward` as Cosmos Journeyer uses the right-handed coordinate system
 * @returns the forward vector of the given transform in world space
 */
export function getForwardDirection(transformNode: TransformNode): Vector3 {
    return transformNode.getDirection(LocalDirection.FORWARD);
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
    return transformNode.getDirection(LocalDirection.UP);
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
    return transformNode.getDirection(LocalDirection.LEFT);
}

/**
 *
 * @param transformNode
 * @param amount
 */
export function roll(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, getForwardDirection(transformNode), amount);
}

/**
 *
 * @param transformNode
 * @param amount
 */
export function pitch(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, getLeftDirection(transformNode), amount);
}

/**
 *
 * @param transformNode
 * @param amount
 */
export function yaw(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, getUpwardDirection(transformNode), amount);
}

/* #endregion directions */
