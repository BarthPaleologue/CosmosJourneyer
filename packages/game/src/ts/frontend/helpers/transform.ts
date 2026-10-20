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

import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Quaternion } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

/**
 * Orients a transform toward a world-space target with the scene’s handedness correction.
 * @param transformNode - Transform whose pose is read or updated.
 * @param target - World-space point to face.
 * @param useRightHandedSystem - Whether the scene uses right-handed coordinates.
 */
export function lookAt(transformNode: TransformNode, target: Vector3, useRightHandedSystem: boolean): void {
    transformNode.lookAt(target);
    if (useRightHandedSystem) {
        transformNode.rotate(Axis.Y, Math.PI);
    }
}

/**
 * Applies a world-space displacement and refreshes the transform matrix.
 * @param transformNode - Transform whose pose is read or updated.
 * @param displacement - World-space translation.
 */
export function translate(transformNode: TransformNode, displacement: Vector3): void {
    transformNode.setAbsolutePosition(transformNode.getAbsolutePosition().add(displacement));
    transformNode.computeWorldMatrix(true);
}

/**
 * Refreshes the world matrix after rotation around a pivot.
 * @param transformNode - Transform whose pose is read or updated.
 * @param pivot - World-space rotation center.
 * @param axis - World-space rotation axis.
 * @param amount - Rotation angle in radians.
 */
export function rotateAround(transformNode: TransformNode, pivot: Vector3, axis: Vector3, amount: number): void {
    transformNode.rotateAround(pivot, axis, amount);
    transformNode.computeWorldMatrix(true);
}

/**
 * @param transformNode - Transform whose pose is read or updated.
 * @param axis - World-space rotation axis.
 * @param amount - Rotation angle in radians.
 */
export function rotate(transformNode: TransformNode, axis: Vector3, amount: number): void {
    transformNode.rotate(axis, amount, Space.WORLD);
}

/**
 * Throws if the transform has no rotation quaternion.
 * @param transformNode - Transform whose pose is read or updated.
 * @returns The transform’s existing rotation quaternion.
 */
export function getRotationQuaternion(transformNode: TransformNode): Quaternion {
    if (transformNode.rotationQuaternion === null) {
        throw new Error(`Null quaternion for ${transformNode.name}`);
    }
    return transformNode.rotationQuaternion;
}

/**
 * Assigns a rotation quaternion and refreshes the world matrix.
 * @param transformNode - Transform whose pose is read or updated.
 * @param newRotation - Rotation quaternion assigned to the transform.
 */
export function setRotationQuaternion(transformNode: TransformNode, newRotation: Quaternion): void {
    transformNode.rotationQuaternion = newRotation;
    transformNode.computeWorldMatrix(true);
}

/**
 * Rotates a transform to align its up direction with the requested vector.
 * @param transformNode - Transform whose pose is read or updated.
 * @param newUp - Desired normalized up direction.
 */
export function setUpVector(transformNode: TransformNode, newUp: Vector3): void {
    if (newUp.equalsWithEpsilon(transformNode.up, 1e-7)) {
        return;
    }
    const currentUp = transformNode.up;
    const rotationAxis = Vector3.Cross(newUp, currentUp);
    const angle = -Math.acos(Vector3.Dot(newUp, currentUp));
    rotate(transformNode, rotationAxis, angle);
}

/* #region directions */

/**
 * @param transformNode - Transform whose pose is read or updated.
 * @param amount - Rotation angle in radians.
 */
export function roll(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, transformNode.forward, amount);
}

/**
 * @param transformNode - Transform whose pose is read or updated.
 * @param amount - Rotation angle in radians.
 */
export function pitch(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, transformNode.right, amount);
}

/**
 * @param transformNode - Transform whose pose is read or updated.
 * @param amount - Rotation angle in radians.
 */
export function yaw(transformNode: TransformNode, amount: number): void {
    rotate(transformNode, transformNode.up, amount);
}

/* #endregion directions */
