import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function hashVec3(v: Vector3): number {
    const hash = (v.x * 73856093) ^ (v.y * 19349663) ^ (v.z * 83492791);
    const n = 1000000000;
    return hash % n;
}
