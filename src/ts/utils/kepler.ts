// from https://www.youtube.com/watch?v=UXD97l7ZT0w

import { Vector3 } from "@babylonjs/core";
import { AbstractBody } from "../celestialBodies/abstractBody";
import { Transformable } from "../celestialBodies/interfaces";

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
    return 4 * x ** 3 + (-4 - (4 / n)) * x ** 2 + (1 + (4 / n)) * x;
}

export function computeBarycenter(body: Transformable, bodies: AbstractBody[]) {
    let barycenter = Vector3.Zero();
    let sum = 0;
    //let totalWMass = 0;
    //let d2Buffer = 0;
    let bodies2 = bodies.sort((a: AbstractBody, b: AbstractBody) => a.physicalProperties.mass - b.physicalProperties.mass);
    for (const otherBody of bodies) {
        if (otherBody == body) continue;
        /*if (totalWMass == 0) {
            // premier corps
            const d2 = body.getAbsolutePosition().subtract(otherBody.getAbsolutePosition()).lengthSquared();
            barycenter.addInPlace(otherBody.getAbsolutePosition());
            totalWMass = otherBody.physicalProperties.mass / d2;
            //d2Buffer = d2;
        } else {
            // autres corps
            const d2 = body.getAbsolutePosition().subtract(otherBody.getAbsolutePosition()).lengthSquared();
            const otherWMass = otherBody.physicalProperties.mass / d2;

            let baryFactor = hermiteCorrector(totalWMass / (otherWMass + totalWMass), 2);
            let otherFactor = hermiteCorrector(otherWMass / (otherWMass + totalWMass), 2);

            barycenter = barycenter.scale(baryFactor).add(otherBody.getAbsolutePosition().scale(otherFactor));


            const newD2 = body.getAbsolutePosition().subtract(otherBody.getAbsolutePosition()).lengthSquared();
            //totalWMass *= d2Buffer;
            totalWMass += otherWMass * d2 / newD2;
            //totalWMass /= newD2;

            //d2Buffer = newD2;
        }*/
        const d2 = body.getAbsolutePosition().subtract(otherBody.getAbsolutePosition()).lengthSquared();
        const factor = otherBody.physicalProperties.mass / d2;
        barycenter.addInPlace(otherBody.getAbsolutePosition().scale(factor));
        sum += factor;
    }
    if (sum > 0) barycenter.scaleInPlace(1 / sum);
    //if (totalWMass == 0) throw new Error("No body in my city wtf bro");
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
