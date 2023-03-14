import { Vector3 } from "@babylonjs/core";

export function rayIntersectSphere(rayOrigin: Vector3, rayDir: Vector3, spherePosition: Vector3, sphereRadius: number): [boolean, number, number] {
    const relativeOrigin = rayOrigin.subtract(spherePosition); // rayOrigin in sphere space

    const a = 1.0;
    const b = 2.0 * Vector3.Dot(relativeOrigin, rayDir);
    const c = Vector3.Dot(relativeOrigin, relativeOrigin) - sphereRadius ** 2;

    const d = b * b - 4.0 * a * c;

    if (d < 0.0) return [false, 0, 0]; // no intersection

    const s = Math.sqrt(d);

    const r0 = (-b - s) / (2.0 * a);
    const r1 = (-b + s) / (2.0 * a);

    const t0 = Math.max(Math.min(r0, r1), 0.0);
    const t1 = Math.max(Math.max(r0, r1), 0.0);

    return [t1 > 0.0, t0, t1];
}
