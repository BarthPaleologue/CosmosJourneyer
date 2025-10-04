import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { Orbit } from "@/backend/universe/orbitalObjects/orbit";

import { findMinimumNewtonRaphson } from "@/utils/math";
import { computeLpFactor, getOrbitalPeriod, keplerEquation } from "@/utils/physics/orbit";
import type { DeepReadonly } from "@/utils/types";

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

/**
 * Returns the point on the orbit of the body at time t. The orbit are circular for the p-norm.
 * @param centerOfMass
 * @param orbit
 * @param t
 * @returns
 */
export function getPointOnOrbit(
    centerOfMass: Vector3,
    parentMass: number,
    orbit: DeepReadonly<Orbit>,
    t: number,
    referencePlaneRotation: Matrix,
): Vector3 {
    const point = getPointOnOrbitLocal(orbit, parentMass, t);

    Vector3.TransformCoordinatesToRef(point, referencePlaneRotation, point);

    return point.addInPlace(centerOfMass);
}
