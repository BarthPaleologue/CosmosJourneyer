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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";

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
