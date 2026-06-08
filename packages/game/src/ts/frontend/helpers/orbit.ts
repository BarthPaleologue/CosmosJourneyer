import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { computeLpFactor, getOrbitalPeriod, keplerEquation } from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { Orbit, Rotation } from "@cosmos-journeyer/universe-model";

import { findMinimumNewtonRaphson } from "@/utils/math";

/**
 *
 * @param orbit
 * @param t
 * @returns
 * @see https://medium.com/@barth_29567/crazy-orbits-lets-make-squares-c91a427c6b26
 */
export function getPointOnOrbitLocal(orbit: DeepReadonly<Orbit>, parentMass: number, t: number): Vector3 {
    const orbitalPeriod = getOrbitalPeriod(orbit.semiMajorAxis, parentMass);
    const meanAnomaly = orbitalPeriod > 0 ? orbit.initialMeanAnomaly - (2 * Math.PI * t) / orbitalPeriod : 0;

    const trueAnomaly = findMinimumNewtonRaphson(
        (trueAnomaly) => keplerEquation(trueAnomaly, meanAnomaly, orbit.eccentricity),
        meanAnomaly,
    );

    const x = Math.cos(trueAnomaly);
    const y = Math.sin(trueAnomaly);

    const LpFactor = computeLpFactor(x, y, orbit.p);

    const semiMinorAxis = orbit.semiMajorAxis * Math.sqrt(1 - orbit.eccentricity ** 2);

    const linearEccentricity = orbit.eccentricity * orbit.semiMajorAxis;

    const point = new Vector3(orbit.semiMajorAxis * x - linearEccentricity, 0, semiMinorAxis * y);

    point.scaleInPlace(LpFactor);

    const argumentOfPeriapsisTransform = Matrix.RotationAxis(Axis.Y, orbit.argumentOfPeriapsis);
    const inclinationTransform = Matrix.RotationAxis(Axis.Z, orbit.inclination);
    const longitudeOfAscendingNodeTransform = Matrix.RotationAxis(Axis.Y, orbit.longitudeOfAscendingNode);

    Vector3.TransformCoordinatesToRef(point, argumentOfPeriapsisTransform, point);

    Vector3.TransformCoordinatesToRef(point, inclinationTransform, point);

    Vector3.TransformCoordinatesToRef(point, longitudeOfAscendingNodeTransform, point);

    return point;
}

export function computeAbsoluteOrientation(
    orbitalInclination: number,
    rotation: DeepReadonly<Rotation>,
    elapsedSeconds: number,
): Quaternion {
    const spinAxisOrientation = computeSpinAxisOrientation(orbitalInclination, rotation);

    let rotationAngle = rotation.initialRotationAngle;
    if (rotation.siderealPeriod !== 0) {
        rotationAngle += (2 * Math.PI * elapsedSeconds) / rotation.siderealPeriod;
    }

    return spinAxisOrientation.multiply(Quaternion.RotationAxis(Axis.Y, rotationAngle));
}

export function computeSpinAxisOrientation(orbitalInclination: number, rotation: DeepReadonly<Rotation>): Quaternion {
    const orbitOrientation = Quaternion.RotationAxis(Axis.Z, orbitalInclination);

    const spinAxisLocalOrientation = Quaternion.RotationAxis(Axis.Z, rotation.axialTilt).multiply(
        Quaternion.RotationAxis(Axis.Y, rotation.spinAxisAzimuth),
    );

    return orbitOrientation.multiply(spinAxisLocalOrientation);
}
