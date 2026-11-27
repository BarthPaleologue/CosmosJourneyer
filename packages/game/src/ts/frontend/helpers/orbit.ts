import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { computeLpFactor, getOrbitalPeriod, keplerEquation, radians } from "@cosmos-journeyer/physics";
import type { Kilograms, Seconds } from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { Orbit, OrbitalPlane, SpinModel } from "@cosmos-journeyer/universe-model";

import { findMinimumNewtonRaphson } from "@/utils/math";

/**
 * Evaluates an Lp-shaped Keplerian orbit in its parent-centered frame at the given time.
 * @param orbit - Orbit parameters in the parent-centered frame.
 * @param parentMass - Combined parent mass in kilograms.
 * @param t - Elapsed simulation time in seconds.
 * @returns Parent-relative position in meters.
 */
export function getPointOnOrbitLocal(orbit: DeepReadonly<Orbit>, parentMass: Kilograms, t: Seconds): Vector3 {
    const orbitalPeriod = getOrbitalPeriod(orbit.semiMajorAxis, parentMass);
    const meanAnomaly = orbitalPeriod > 0 ? orbit.initialMeanAnomaly - (2 * Math.PI * t) / orbitalPeriod : 0;

    const trueAnomaly = findMinimumNewtonRaphson(
        (anomaly) => keplerEquation(radians(anomaly), radians(meanAnomaly), orbit.eccentricity),
        meanAnomaly,
        100,
    );

    const x = Math.cos(trueAnomaly);
    const y = Math.sin(trueAnomaly);

    const LpFactor = computeLpFactor(x, y, orbit.p);

    const semiMinorAxis = orbit.semiMajorAxis * Math.sqrt(1 - orbit.eccentricity ** 2);

    const linearEccentricity = orbit.eccentricity * orbit.semiMajorAxis;

    const point = new Vector3(orbit.semiMajorAxis * x - linearEccentricity, 0, semiMinorAxis * y);

    point.scaleInPlace(LpFactor);

    const argumentOfPeriapsisTransform = Matrix.RotationAxis(Axis.Y, orbit.argumentOfPeriapsis);
    const inclinationTransform = Matrix.RotationAxis(Axis.Z, orbit.plane.inclination);
    const longitudeOfAscendingNodeTransform = Matrix.RotationAxis(Axis.Y, orbit.plane.longitudeOfAscendingNode);

    Vector3.TransformCoordinatesToRef(point, argumentOfPeriapsisTransform, point);

    Vector3.TransformCoordinatesToRef(point, inclinationTransform, point);

    Vector3.TransformCoordinatesToRef(point, longitudeOfAscendingNodeTransform, point);

    return point;
}

/**
 * Combines the orbital plane and tilted spin axis with the elapsed sidereal rotation.
 * @param orbitalPlane - Inclination and ascending-node longitude in radians.
 * @param spin - Axial tilt, axis azimuth, and sidereal rotation parameters.
 * @param elapsedSeconds - Elapsed simulation time in seconds.
 * @returns The absolute body orientation quaternion.
 */
export function computeAbsoluteOrientation(
    orbitalPlane: DeepReadonly<OrbitalPlane>,
    spin: DeepReadonly<SpinModel>,
    elapsedSeconds: Seconds,
): Quaternion {
    const spinAxisOrientation = computeSpinAxisOrientation(orbitalPlane, spin);

    const rotationAngle = radians(
        spin.initialRotationAngle +
            (spin.siderealPeriod !== 0 ? (2 * Math.PI * elapsedSeconds) / spin.siderealPeriod : 0),
    );

    return spinAxisOrientation.multiply(Quaternion.RotationAxis(Axis.Y, rotationAngle));
}

/**
 * Computes the tilted spin axis relative to the orbital plane without the sidereal phase.
 * @param orbitalPlane - Inclination and ascending-node longitude in radians.
 * @param spin - Axial tilt, axis azimuth, and sidereal rotation parameters.
 * @returns The absolute spin-axis orientation quaternion.
 */
export function computeSpinAxisOrientation(
    orbitalPlane: DeepReadonly<OrbitalPlane>,
    spin: DeepReadonly<SpinModel>,
): Quaternion {
    const orbitOrientation = Quaternion.RotationAxis(Axis.Y, orbitalPlane.longitudeOfAscendingNode).multiply(
        Quaternion.RotationAxis(Axis.Z, orbitalPlane.inclination),
    );

    const spinAxisLocalOrientation = Quaternion.RotationAxis(Axis.Y, spin.axisAzimuth).multiply(
        Quaternion.RotationAxis(Axis.Z, spin.axialTilt),
    );

    return orbitOrientation.multiply(spinAxisLocalOrientation);
}
