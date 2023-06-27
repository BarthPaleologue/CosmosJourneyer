// from https://www.youtube.com/watch?v=UXD97l7ZT0w

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { IOrbitalObject } from "./iOrbitalObject";
import { IOrbitalProperties } from "./iOrbitalProperties";
import { stripAxisFromQuaternion } from "../utils/algebra";
import { BaseModel } from "../models/common";
import { Axis } from "@babylonjs/core/Maths/math.axis";

/**
 * Returns 0 when the arguments are solution to the Kepler's equation
 * @param E The angle on the elliptical orbit
 * @param M The angle on the equivalent circular orbit
 * @param e The eccentricity of the orbit (0 = circle, 1 = parabola)
 */
export function keplerEquation(E: number, M: number, e: number) {
    return M - E + e * Math.sin(E);
}

/**
 * Solves Kepler's equation for the eccentric anomaly using Newton's method
 * @param M 
 * @param e 
 * @returns 
 */
export function solveKepler(M: number, e: number) {
    const h = 1e-4;
    const epsilon = 1e-8;
    let guess = M;
    const maxIterations = 100;
    for (let i = 0; i < maxIterations; i++) {
        const y = keplerEquation(guess, M, e);
        if (Math.abs(y) < epsilon) break;
        const slope = (keplerEquation(guess + h, M, e) - y) / h;
        const step = y / slope;

        guess -= step;
    }
    return guess;
}

export function computeBarycenter(body: IOrbitalObject, relevantBodies: IOrbitalObject[]): [Vector3, Quaternion] {
    const barycenter = body.transform.getAbsolutePosition().scale(body.model.physicalProperties.mass);
    const meanQuaternion = Quaternion.Zero();
    let sumPosition = body.model.physicalProperties.mass;
    let sumQuaternion = 0;
    for (const otherBody of relevantBodies) {
        const mass = otherBody.model.physicalProperties.mass;
        barycenter.addInPlace(otherBody.transform.getAbsolutePosition().scale(mass));
        meanQuaternion.addInPlace(stripAxisFromQuaternion(otherBody.transform.getRotationQuaternion(), Axis.Y).scale(mass));
        sumPosition += mass;
        sumQuaternion += mass;
    }
    if (sumPosition > 0) barycenter.scaleInPlace(1 / sumPosition);
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

    return relativePosition.addInPlace(ellipseCenter);
}

/**
 *
 * @param periapsis
 * @param apoapsis
 * @param otherBodies
 * @see https://www.wikiwand.com/fr/Lois_de_Kepler#/Troisi%C3%A8me_loi_%E2%80%93_Loi_des_p%C3%A9riodes
 */
export function getOrbitalPeriod(periapsis: number, apoapsis: number, otherBodies: BaseModel[]) {
    const a = (periapsis + apoapsis) / 2;
    const G = 1e12;
    let M = 0;
    for (const otherBody of otherBodies) M += otherBody.physicalProperties.mass;
    if (M === 0) return 0;
    return Math.sqrt((4 * Math.PI ** 2 * a ** 3) / (G * M));
}
