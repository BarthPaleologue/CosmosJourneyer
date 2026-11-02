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

import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";

const currentDirection = Vector3.Zero();
const targetUnitDirection = Vector3.Zero();
const correction = Quaternion.Identity();

/**
 * Aligns a local axis with a target direction by applying the shortest correction to a unit quaternion.
 * @param rotation - Unit quaternion mapping local coordinates into the target direction's reference frame.
 * @param localAxis - Unit direction in the object's local coordinates.
 * @param targetDirection - Nonzero direction in the reference frame of rotation.
 * @param result - Destination quaternion. May be the same object as rotation.
 */
export function alignRotationToRef(
    rotation: Readonly<Quaternion>,
    localAxis: Readonly<Vector3>,
    targetDirection: Readonly<Vector3>,
    result: Quaternion,
): void {
    localAxis.applyRotationQuaternionToRef(rotation, currentDirection).normalize();
    targetDirection.normalizeToRef(targetUnitDirection);
    // Allow rounding in rotated unit vectors without Babylon's coarse antiparallel threshold.
    Quaternion.FromUnitVectorsToRef(currentDirection, targetUnitDirection, correction, 1e-12);
    correction.multiplyToRef(rotation, result);
}

/**
 * Maps local -Z to forward and +Y to the orthogonal projection of up.
 * Builds a right-handed orthonormal basis without modifying either input.
 * Invalid or zero forward returns identity. Invalid, zero, or parallel up uses
 * the cardinal axis least aligned with forward to define a deterministic roll.
 * @param forward - Desired forward direction in the destination frame.
 * @param up - Preferred up direction in the destination frame.
 * @returns A unit quaternion mapping local coordinates into the destination frame.
 */
export function quaternionFromForwardUpRH(forward: Readonly<Vector3>, up: Readonly<Vector3>): Quaternion {
    const zAxis = normalizedDirection(forward);
    if (zAxis === undefined) {
        return Quaternion.Identity();
    }
    zAxis.negateInPlace();
    const upAxis = normalizedDirection(up);
    const xAxis = upAxis === undefined ? Vector3.Zero() : Vector3.Cross(upAxis, zAxis);
    if (xAxis.lengthSquared() < 1e-12) {
        const fallback =
            Math.abs(zAxis.x) <= Math.abs(zAxis.y) && Math.abs(zAxis.x) <= Math.abs(zAxis.z)
                ? Vector3.RightReadOnly
                : Math.abs(zAxis.y) <= Math.abs(zAxis.z)
                  ? Vector3.UpReadOnly
                  : Vector3.LeftHandedForwardReadOnly;
        Vector3.CrossToRef(fallback, zAxis, xAxis);
    }
    xAxis.normalize();
    const yAxis = Vector3.Cross(zAxis, xAxis);
    const matrix = Matrix.Identity();
    Matrix.FromXYZAxesToRef(xAxis, yAxis, zAxis, matrix);
    return Quaternion.FromRotationMatrix(matrix).normalize();
}

/**
 * Normalizes finite directions without overflowing or underflowing their length.
 * @param direction - Input direction, left unchanged.
 * @returns A unit direction, or undefined for zero or nonfinite inputs.
 */
function normalizedDirection(direction: Readonly<Vector3>): Vector3 | undefined {
    const scale = Math.max(Math.abs(direction.x), Math.abs(direction.y), Math.abs(direction.z));
    if (!Number.isFinite(scale) || scale === 0) {
        return undefined;
    }
    return new Vector3(direction.x / scale, direction.y / scale, direction.z / scale).normalize();
}
