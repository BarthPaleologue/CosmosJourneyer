import { Quaternion, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";

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

export function flattenVector4Array(vector4Array: Vector4[]): number[] {
    const result: number[] = [];
    for (const vector4 of vector4Array) {
        result.push(vector4.x, vector4.y, vector4.z, vector4.w);
    }
    return result;
}
