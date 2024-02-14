//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Quaternion, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";

/**
 * Removes the rotation around an axis from the quaternion
 * @param quaternion the quaternion to strip
 * @param axisToRemove the axis to remove the rotation around (unit vector)
 * @return a new Quaternion
 * @see https://stackoverflow.com/a/22401169
 */
export function stripAxisFromQuaternion(quaternion: Quaternion, axisToRemove: Vector3): Quaternion {
    const rotationAxis = new Vector3(quaternion.x, quaternion.y, quaternion.z);
    const p = axisToRemove.scale(Vector3.Dot(rotationAxis, axisToRemove)); // return projection v1 on to v2  (parallel component)
    const twist = new Quaternion(p.x, p.y, p.z, quaternion.w);
    twist.normalize();
    return quaternion.multiply(twist.conjugate());
}

export function getAxisComponentFromQuaternion(quaternion: Quaternion, axisToGet: Vector3): Quaternion {
    const rotationAxis = new Vector3(quaternion.x, quaternion.y, quaternion.z);
    const p = axisToGet.scale(Vector3.Dot(rotationAxis, axisToGet)); // return projection v1 on to v2  (parallel component)
    const twist = new Quaternion(p.x, p.y, p.z, quaternion.w);
    return twist.normalize().conjugate();
}

export function getTransformationQuaternion(from: Vector3, to: Vector3): Quaternion {
    const rotationAxis = Vector3.Cross(from, to);
    const angle = Math.acos(Vector3.Dot(from, to));
    return Quaternion.RotationAxis(rotationAxis, angle);
}

export function flattenVector3Array(vector3Array: Vector3[]): number[] {
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

export function flattenVector4Array(vector4Array: Vector4[]): number[] {
    const result: number[] = [];
    for (const vector4 of vector4Array) {
        result.push(vector4.x, vector4.y, vector4.z, vector4.w);
    }
    return result;
}

export function mapVector3(v: Vector3, f: (x: number) => number): Vector3 {
    return new Vector3(f(v.x), f(v.y), f(v.z));
}
