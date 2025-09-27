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

import { type Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";

import { clamp } from "@/utils/math";
import type { Vector3Like } from "@/utils/types";

export function wrapVector3(vector: Vector3Like, target = new Vector3()): Vector3 {
    return target.copyFromFloats(vector.x, vector.y, vector.z);
}

export function getTransformationQuaternion(from: Vector3, to: Vector3): Quaternion {
    if (from.equalsWithEpsilon(to)) {
        return Quaternion.Identity();
    }

    const crossProduct = Vector3.Cross(from, to);
    if (crossProduct.lengthSquared() < 1e-8) {
        let axis: Vector3;
        if (Math.abs(from.x) < Math.abs(from.y)) {
            axis = Math.abs(from.x) < Math.abs(from.z) ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1);
        } else {
            axis = Math.abs(from.y) < Math.abs(from.z) ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);
        }
        axis = Vector3.Cross(from, axis).normalize();
        return Quaternion.RotationAxis(axis, Math.PI);
    }

    const cosTheta = clamp(Vector3.Dot(from, to), -1, 1);
    const theta = Math.acos(cosTheta);

    return Quaternion.RotationAxis(crossProduct.normalize(), theta);
}

export function getDeltaQuaternion(from: Quaternion, to: Quaternion): Quaternion {
    return to.multiply(from.conjugate());
}

export function getAngleFromQuaternion(quaternion: Quaternion): number {
    return 2 * Math.acos(quaternion.w);
}

export function getAxisFromQuaternion(quaternion: Quaternion): Vector3 {
    return new Vector3(quaternion.x, quaternion.y, quaternion.z).normalize();
}

export function flattenVector3Array(vector3Array: ReadonlyArray<Vector3Like>): number[] {
    const result: number[] = [];
    for (const vector3 of vector3Array) {
        result.push(vector3.x, vector3.y, vector3.z);
    }
    return result;
}

export function flattenColor3Array(color3Array: Color3[]): number[] {
    const result: number[] = [];
    for (const color3 of color3Array) {
        result.push(color3.r, color3.g, color3.b);
    }
    return result;
}
