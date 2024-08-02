/**
 * Compute the rotation period for a ring of given radius to simulate a given gravity.
 * @param radius The radius of the ring
 * @param gravity The gravity to simulate
 */
export function computeRingRotationPeriod(radius: number, gravity: number): number {
    // g = v * v / r and T = 2 * pi * r / v => v = sqrt(g * r) and T = 2 * pi * r / sqrt(g * r) = 2 * pi * sqrt(r / g)
    return 2 * Math.PI * Math.sqrt(radius / gravity);
}
