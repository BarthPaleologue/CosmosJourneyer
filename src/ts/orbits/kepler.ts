// from https://www.youtube.com/watch?v=UXD97l7ZT0w

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { IOrbitalBody } from "./iOrbitalBody";
import { IOrbitalProperties } from "./iOrbitalProperties";
import { stripAxisFromQuaternion } from "../utils/algebra";
import { BodyDescriptor } from "../descriptors/common";
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

export function computeBarycenter2(bodies: IOrbitalBody[]): Vector3 {
    if (bodies.length === 0) throw new Error("Can compute the barycenter of zero bodies");
    const barycenter = Vector3.Zero();
    let sum = 0;
    for (const body of bodies) {
        barycenter.addInPlace(body.transform.getAbsolutePosition().scale(body.descriptor.physicalProperties.mass));
        sum += body.descriptor.physicalProperties.mass;
    }
    return barycenter.scaleInPlace(1 / sum);
}

export function computeBarycenter(body: IOrbitalBody, relevantBodies: IOrbitalBody[]): [Vector3, Quaternion] {
    const barycenter = body.transform.getAbsolutePosition().scale(body.descriptor.physicalProperties.mass);
    const meanQuaternion = Quaternion.Zero();
    let sumPosition = body.descriptor.physicalProperties.mass;
    let sumQuaternion = 0;
    for (const otherBody of relevantBodies) {
        const mass = otherBody.descriptor.physicalProperties.mass;
        barycenter.addInPlace(otherBody.transform.getAbsolutePosition().scale(mass));
        meanQuaternion.addInPlace(stripAxisFromQuaternion(otherBody.transform.getRotationQuaternion(), Axis.Y).scale(mass));
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

/**
 *
 * @param periapsis
 * @param apoapsis
 * @param otherBodies
 * @see https://www.wikiwand.com/fr/Lois_de_Kepler#/Troisi%C3%A8me_loi_%E2%80%93_Loi_des_p%C3%A9riodes
 */
export function getOrbitalPeriod(periapsis: number, apoapsis: number, otherBodies: BodyDescriptor[]) {
    const a = (periapsis + apoapsis) / 2;
    const G = 1e12;
    let M = 0;
    for (const otherBody of otherBodies) M += otherBody.physicalProperties.mass;
    if (M === 0) return 0;
    return Math.sqrt((4 * Math.PI ** 2 * a ** 3) / (G * M));
}
