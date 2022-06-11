// from https://www.youtube.com/watch?v=UXD97l7ZT0w

import { Vector3 } from "@babylonjs/core";
import { IOrbitalBody } from "../celestialBodies/iOrbitalBody";

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

function hermiteCorrector(x: number, n: number): number {
    return 4 * x ** 3 + (-4 - 4 / n) * x ** 2 + (1 + 4 / n) * x;
}

export function computeBarycenter(body: IOrbitalBody, relevantBodies: IOrbitalBody[]): Vector3 {
    let barycenter = body.getAbsolutePosition().scale(body.physicalProperties.mass);
    let sum = body.physicalProperties.mass;
    for (const otherBody of relevantBodies) {
        const mass = otherBody.physicalProperties.mass;
        barycenter.addInPlace(otherBody.getAbsolutePosition().scale(mass));
        sum += mass;
    }
    if (sum > 0) barycenter.scaleInPlace(1 / sum);
    return barycenter;
}

export function computePointOnOrbit(centerOfMass: Vector3, periapsis: number, apoapsis: number, period: number, t: number): Vector3 {
    let semiMajorLength = (periapsis + apoapsis) / 2;
    let linearEccentricity = semiMajorLength - periapsis;
    let eccentricity = linearEccentricity / semiMajorLength;

    let semiMinorLength = Math.sqrt(semiMajorLength ** 2 - linearEccentricity ** 2);
    let ellipseCenterX = centerOfMass.x - linearEccentricity;
    let ellipseCenterY = centerOfMass.y;
    let ellipseCenterZ = centerOfMass.z;

    let meanAnomaly = (Math.PI * 2 * t) / period;
    let eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);

    let pointX = Math.cos(eccentricAnomaly) * semiMajorLength + ellipseCenterX;
    let pointY = ellipseCenterY;
    let pointZ = Math.sin(eccentricAnomaly) * semiMinorLength + ellipseCenterZ;

    return new Vector3(pointX, pointY, pointZ);
}
