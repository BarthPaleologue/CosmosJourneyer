export function hashVec3(x: number, y: number, z: number): number {
    const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
    const n = 1000000000;
    return hash % n;
}
