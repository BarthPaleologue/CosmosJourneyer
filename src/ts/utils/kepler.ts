// from https://www.youtube.com/watch?v=UXD97l7ZT0w

import {Vector2} from "@babylonjs/core";

/**
 * Returns 0 when the arguments are solution to the Kepler's equation
 * @param E The angle on the elliptical orbit
 * @param M The angle on the equivalent circular orbit
 * @param e The eccentricity of the orbit (0 = circle, 1 = parabola)
 */
export function keplerEquation(E: number, M: number, e: number) {
    return M - E + e * Math.sin(E);
}

export function solveKepler(M: number, e: number) {
    const h = 1e-4;
    const epsilon = 1e-8;
    let guess = M;
    const maxIterations = 100;
    for (let i = 0; i < maxIterations; i++) {
        let y = keplerEquation(guess, M, e);
        if (Math.abs(y) < epsilon) break;
        let slope = (keplerEquation(guess + h, M, e) - y) / h;
        let step = y / slope;

        guess -= step;
    }
    return guess;
}

export function computePointOnOrbit(centerOfMass: Vector2, periapsis: number, apoapsis: number, t: number) {
    let semiMajorLength = (periapsis + apoapsis) / 2;
    let linearEccentricity = semiMajorLength - periapsis;
    let eccentricity = linearEccentricity / semiMajorLength;

    let semiMinorLength = Math.sqrt(semiMajorLength ** 2 - linearEccentricity ** 2);
    let ellipseCenterX = centerOfMass.x - linearEccentricity;
    let ellipseCenterY = centerOfMass.y;

    let meanAnomaly = Math.PI * 2 * t;
    let eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);

    let pointX = Math.cos(eccentricAnomaly) * semiMajorLength + ellipseCenterX;
    let pointY = Math.sin(eccentricAnomaly) * semiMinorLength + ellipseCenterY;

    return new Vector2(pointX, pointY);
}