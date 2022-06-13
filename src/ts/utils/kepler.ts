// from https://www.youtube.com/watch?v=UXD97l7ZT0w

import { Axis, Quaternion, Vector3 } from "@babylonjs/core";
import { IOrbitalBody } from "../celestialBodies/iOrbitalBody";
import { IOrbitalProperties } from "../celestialBodies/iOrbitalProperties";
import { stripAxisFromQuaternion } from "./algebra";

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

export function computeBarycenter(body: IOrbitalBody, relevantBodies: IOrbitalBody[]): [Vector3, Quaternion] {
    const barycenter = body.getAbsolutePosition().scale(body.physicalProperties.mass);
    const meanQuaternion = Quaternion.Zero();
    let sumPosition = body.physicalProperties.mass;
    let sumQuaternion = 0;
    for (const otherBody of relevantBodies) {
        const mass = otherBody.physicalProperties.mass;
        barycenter.addInPlace(otherBody.getAbsolutePosition().scale(mass));
        meanQuaternion.addInPlace(stripAxisFromQuaternion(otherBody.getRotationQuaternion(), Axis.Y).scale(mass));
        sumPosition += mass;
        sumQuaternion += mass;
    }
    if (sumPosition > 0) {
        barycenter.scaleInPlace(1 / sumPosition);
    }
    if (sumQuaternion > 0) meanQuaternion.normalize();
    else meanQuaternion.copyFromFloats(0, 0, 0, 1);

    return [barycenter, meanQuaternion];
}

export function computePointOnOrbit(centerOfMass: Vector3, settings: IOrbitalProperties, t: number): Vector3 {
    const semiMajorLength = (settings.periapsis + settings.apoapsis) / 2;
    const linearEccentricity = semiMajorLength - settings.periapsis;
    const eccentricity = linearEccentricity / semiMajorLength;

    const semiMinorLength = Math.sqrt(semiMajorLength ** 2 - linearEccentricity ** 2);

    const ellipseCenter = new Vector3(centerOfMass.x - linearEccentricity, centerOfMass.y, centerOfMass.z);

    const meanAnomaly = (Math.PI * 2 * t) / settings.period;
    const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);

    const relativePosition = new Vector3(Math.cos(eccentricAnomaly) * semiMajorLength, 0, Math.sin(eccentricAnomaly) * semiMinorLength);
    relativePosition.applyRotationQuaternionInPlace(settings.orientationQuaternion);

    return relativePosition.add(ellipseCenter);
}
